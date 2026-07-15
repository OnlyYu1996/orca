import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { migrateLegacyStorageFile } from '../startup/product-storage-migration'
import type { CodeBuddyUsagePersistedState } from './types'

export const CODEBUDDY_USAGE_SCHEMA_VERSION = 1

let codeBuddyUsageFile: string | null = null

export function createDefaultCodeBuddyUsageState(): CodeBuddyUsagePersistedState {
  return {
    schemaVersion: CODEBUDDY_USAGE_SCHEMA_VERSION,
    worktreeFingerprint: null,
    processedFiles: [],
    sessions: [],
    dailyAggregates: [],
    scanState: {
      enabled: false,
      lastScanStartedAt: null,
      lastScanCompletedAt: null,
      lastScanError: null
    }
  }
}

function resolveCodeBuddyUsageFile(): string {
  const userDataPath = app.getPath('userData')
  const usageFile = join(userDataPath, 'sbbgt-codebuddy-usage.json')
  migrateLegacyStorageFile(usageFile, [join(userDataPath, 'orca-codebuddy-usage.json')])
  return usageFile
}

export function initCodeBuddyUsagePath(): void {
  codeBuddyUsageFile = resolveCodeBuddyUsageFile()
}

function getCodeBuddyUsageFile(): string {
  codeBuddyUsageFile ??= resolveCodeBuddyUsageFile()
  return codeBuddyUsageFile
}

export function normalizeCodeBuddyUsageState(
  value: CodeBuddyUsagePersistedState
): CodeBuddyUsagePersistedState {
  const defaults = createDefaultCodeBuddyUsageState()
  if (value.schemaVersion !== CODEBUDDY_USAGE_SCHEMA_VERSION) {
    return defaults
  }
  return {
    ...defaults,
    ...value,
    processedFiles: Array.isArray(value.processedFiles) ? value.processedFiles : [],
    sessions: Array.isArray(value.sessions) ? value.sessions : [],
    dailyAggregates: Array.isArray(value.dailyAggregates) ? value.dailyAggregates : [],
    scanState: { ...defaults.scanState, ...value.scanState }
  }
}

export function loadCodeBuddyUsageState(): CodeBuddyUsagePersistedState {
  try {
    const usageFile = getCodeBuddyUsageFile()
    if (!existsSync(usageFile)) {
      return createDefaultCodeBuddyUsageState()
    }
    return normalizeCodeBuddyUsageState(
      JSON.parse(readFileSync(usageFile, 'utf-8')) as CodeBuddyUsagePersistedState
    )
  } catch (error) {
    console.error('[codebuddy-usage] 读取持久化数据失败，将使用空状态：', error)
    return createDefaultCodeBuddyUsageState()
  }
}

export function writeCodeBuddyUsageState(state: CodeBuddyUsagePersistedState): void {
  const usageFile = getCodeBuddyUsageFile()
  const directory = dirname(usageFile)
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true })
  }
  const temporaryFile = `${usageFile}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(state, null, 2), 'utf-8')
  renameSync(temporaryFile, usageFile)
}
