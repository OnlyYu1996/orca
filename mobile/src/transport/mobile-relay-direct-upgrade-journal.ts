import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { z } from 'zod'
import { hashMobileRelayCredential } from './mobile-relay-credential-hash'

const Base64Url32ByteSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)

export const MobileRelayDirectUpgradeJournalSchema = z
  .object({
    v: z.literal(1),
    hostId: z.string().min(1),
    reqId: z.string().min(1).max(128),
    pendingResumeToken: Base64Url32ByteSchema,
    pendingResumeTokenHash: Base64Url32ByteSchema
  })
  .strict()

export type MobileRelayDirectUpgradeJournal = z.infer<typeof MobileRelayDirectUpgradeJournalSchema>

const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
}
const JOURNAL_KEY_PREFIX = 'sbbgt.mobile-relay.direct-upgrade.'
const LEGACY_JOURNAL_KEY_PREFIX = 'orca.mobile-relay.direct-upgrade.'

function journalKey(hostId: string): string {
  return `${JOURNAL_KEY_PREFIX}${hostId}`
}

function legacyJournalKey(hostId: string): string {
  return `${LEGACY_JOURNAL_KEY_PREFIX}${hostId}`
}

export function createMobileRelayDirectUpgradeJournal(
  hostId: string,
  randomBytes: (length: number) => Uint8Array
): MobileRelayDirectUpgradeJournal {
  const pendingResumeToken = encodeBase64Url(randomBytes(32))
  return MobileRelayDirectUpgradeJournalSchema.parse({
    v: 1,
    hostId,
    reqId: `upgrade-${encodeBase64Url(randomBytes(16))}`,
    pendingResumeToken,
    pendingResumeTokenHash: hashMobileRelayCredential(pendingResumeToken)
  })
}

export async function readMobileRelayDirectUpgradeJournal(
  hostId: string
): Promise<MobileRelayDirectUpgradeJournal | null> {
  requireNativeSecretStore()
  const currentKey = journalKey(hostId)
  const legacyKey = legacyJournalKey(hostId)
  const currentRaw = await SecureStore.getItemAsync(currentKey, KEYCHAIN_OPTIONS)
  const raw = currentRaw ?? (await SecureStore.getItemAsync(legacyKey, KEYCHAIN_OPTIONS))
  if (!raw) {
    return null
  }
  try {
    const parsed = MobileRelayDirectUpgradeJournalSchema.safeParse(JSON.parse(raw))
    if (!parsed.success || parsed.data.hostId !== hostId) {
      return null
    }
    if (currentRaw === null) {
      // 迁移只复制已校验记录，旧键保留给回滚版本继续读取。
      await SecureStore.setItemAsync(currentKey, raw, KEYCHAIN_OPTIONS)
    }
    return parsed.data
  } catch {
    return null
  }
}

export async function writeMobileRelayDirectUpgradeJournal(
  journal: MobileRelayDirectUpgradeJournal
): Promise<void> {
  requireNativeSecretStore()
  const parsed = MobileRelayDirectUpgradeJournalSchema.parse(journal)
  await SecureStore.setItemAsync(
    journalKey(parsed.hostId),
    JSON.stringify(parsed),
    KEYCHAIN_OPTIONS
  )
}

export async function deleteMobileRelayDirectUpgradeJournal(hostId: string): Promise<void> {
  if (Platform.OS === 'web') {
    return
  }
  await SecureStore.deleteItemAsync(journalKey(hostId), KEYCHAIN_OPTIONS)
  await SecureStore.deleteItemAsync(legacyJournalKey(hostId), KEYCHAIN_OPTIONS)
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = ''
  for (const byte of value) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function requireNativeSecretStore(): void {
  if (Platform.OS === 'web') {
    throw new Error('赛博包工头 Relay 升级状态需要原生安全存储')
  }
}
