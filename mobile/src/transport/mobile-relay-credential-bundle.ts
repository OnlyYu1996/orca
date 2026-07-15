import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { z } from 'zod'
import type { DeviceCredentialInstalled } from '../../../src/shared/mobile-relay-credential-contract'
import type { MobileRelayPairingJournal } from './mobile-relay-pairing-journal'

const Base64Url32ByteSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)
const ResumeCredentialSchema = z
  .object({
    token: Base64Url32ByteSchema,
    hash: Base64Url32ByteSchema,
    version: z.number().int().positive(),
    expiresAt: z.number().int().nonnegative()
  })
  .strict()

export const MobileRelayCredentialBundleSchema = z
  .object({
    v: z.literal(1),
    hostId: z.string().min(1),
    deviceToken: z.string().min(1),
    current: ResumeCredentialSchema,
    grace: ResumeCredentialSchema.optional(),
    pending: z
      .object({
        token: Base64Url32ByteSchema,
        hash: Base64Url32ByteSchema,
        reqId: z.string().min(1)
      })
      .strict()
      .optional(),
    invite: z
      .object({ token: Base64Url32ByteSchema, expiresAt: z.number().int().positive() })
      .strict()
      .optional()
  })
  .strict()

export type MobileRelayCredentialBundle = z.infer<typeof MobileRelayCredentialBundleSchema>

const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
}
const CREDENTIAL_KEY_PREFIX = 'sbbgt.mobile-relay.credentials.'
const LEGACY_CREDENTIAL_KEY_PREFIX = 'orca.mobile-relay.credentials.'

function credentialKey(hostId: string): string {
  return `${CREDENTIAL_KEY_PREFIX}${hostId}`
}

function legacyCredentialKey(hostId: string): string {
  return `${LEGACY_CREDENTIAL_KEY_PREFIX}${hostId}`
}

export function promotePairingJournalCredential(args: {
  journal: MobileRelayPairingJournal
  installed: DeviceCredentialInstalled
}): MobileRelayCredentialBundle {
  const { journal, installed } = args
  if (
    installed.reqId !== journal.metadata.installReqId ||
    installed.authorizationMode !== journal.metadata.authorizationMode
  ) {
    throw new Error('relay credential install result does not match pairing journal')
  }
  return MobileRelayCredentialBundleSchema.parse({
    v: 1,
    hostId: journal.metadata.host.id,
    deviceToken: journal.secrets.deviceToken,
    current: {
      token: journal.secrets.pendingResumeToken,
      hash: journal.metadata.pendingResumeTokenHash,
      version: installed.currentVersion,
      expiresAt: installed.resumeExpiresAt
    }
  })
}

export async function readMobileRelayCredentialBundle(
  hostId: string
): Promise<MobileRelayCredentialBundle | null> {
  requireNativeSecretStore()
  const currentKey = credentialKey(hostId)
  const legacyKey = legacyCredentialKey(hostId)
  const currentRaw = await SecureStore.getItemAsync(currentKey, KEYCHAIN_OPTIONS)
  const raw = currentRaw ?? (await SecureStore.getItemAsync(legacyKey, KEYCHAIN_OPTIONS))
  if (raw === null) {
    return null
  }
  try {
    const result = MobileRelayCredentialBundleSchema.safeParse(JSON.parse(raw))
    if (!result.success || result.data.hostId !== hostId) {
      return null
    }
    if (currentRaw === null) {
      // 旧版密钥只在成功校验后复制；旧键保留给回滚版本继续读取。
      await SecureStore.setItemAsync(currentKey, raw, KEYCHAIN_OPTIONS)
    }
    return result.data
  } catch {
    return null
  }
}

export async function writeMobileRelayCredentialBundle(
  bundle: MobileRelayCredentialBundle
): Promise<void> {
  requireNativeSecretStore()
  const validated = MobileRelayCredentialBundleSchema.parse(bundle)
  await SecureStore.setItemAsync(
    credentialKey(validated.hostId),
    JSON.stringify(validated),
    KEYCHAIN_OPTIONS
  )
}

export async function deleteMobileRelayCredentialBundle(hostId: string): Promise<void> {
  if (Platform.OS === 'web') {
    return
  }
  await SecureStore.deleteItemAsync(credentialKey(hostId), KEYCHAIN_OPTIONS)
  await SecureStore.deleteItemAsync(legacyCredentialKey(hostId), KEYCHAIN_OPTIONS)
}

function requireNativeSecretStore(): void {
  if (Platform.OS === 'web') {
    throw new Error('赛博包工头 Relay 凭据需要原生安全存储')
  }
}
