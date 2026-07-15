import type { StateCreator } from 'zustand'
import type {
  CodeBuddyUsageBreakdownRow,
  CodeBuddyUsageDailyPoint,
  CodeBuddyUsageRange,
  CodeBuddyUsageScanState,
  CodeBuddyUsageScope,
  CodeBuddyUsageSessionRow,
  CodeBuddyUsageSnapshot,
  CodeBuddyUsageSummary
} from '../../../../shared/codebuddy-usage-types'
import type { AppState } from '../types'

export type CodeBuddyUsageSlice = {
  codeBuddyUsageScope: CodeBuddyUsageScope
  codeBuddyUsageRange: CodeBuddyUsageRange
  codeBuddyUsageScanState: CodeBuddyUsageScanState | null
  codeBuddyUsageSummary: CodeBuddyUsageSummary | null
  codeBuddyUsageDaily: CodeBuddyUsageDailyPoint[]
  codeBuddyUsageModelBreakdown: CodeBuddyUsageBreakdownRow[]
  codeBuddyUsageProjectBreakdown: CodeBuddyUsageBreakdownRow[]
  codeBuddyUsageRecentSessions: CodeBuddyUsageSessionRow[]
  setCodeBuddyUsageEnabled: (enabled: boolean) => Promise<void>
  setCodeBuddyUsageScope: (scope: CodeBuddyUsageScope) => Promise<void>
  setCodeBuddyUsageRange: (range: CodeBuddyUsageRange) => Promise<void>
  fetchCodeBuddyUsage: (options?: { forceRefresh?: boolean }) => Promise<void>
  enableCodeBuddyUsage: () => Promise<void>
  refreshCodeBuddyUsage: () => Promise<void>
}

type CodeBuddyUsageDataState = Pick<
  CodeBuddyUsageSlice,
  | 'codeBuddyUsageSummary'
  | 'codeBuddyUsageDaily'
  | 'codeBuddyUsageModelBreakdown'
  | 'codeBuddyUsageProjectBreakdown'
  | 'codeBuddyUsageRecentSessions'
>

const EMPTY_USAGE_DATA: CodeBuddyUsageDataState = {
  codeBuddyUsageSummary: null,
  codeBuddyUsageDaily: [],
  codeBuddyUsageModelBreakdown: [],
  codeBuddyUsageProjectBreakdown: [],
  codeBuddyUsageRecentSessions: []
}

export const createCodeBuddyUsageSlice: StateCreator<AppState, [], [], CodeBuddyUsageSlice> = (
  set,
  get
) => ({
  codeBuddyUsageScope: 'worktrees',
  codeBuddyUsageRange: '30d',
  codeBuddyUsageScanState: null,
  ...EMPTY_USAGE_DATA,

  setCodeBuddyUsageEnabled: async (enabled) => {
    try {
      const nextState = await window.api.codeBuddyUsage.setEnabled({ enabled })
      set({
        codeBuddyUsageScanState: enabled
          ? {
              ...nextState,
              isScanning: true,
              lastScanCompletedAt: null,
              lastScanError: null
            }
          : nextState,
        ...EMPTY_USAGE_DATA
      })
      if (enabled) {
        await get().fetchCodeBuddyUsage({ forceRefresh: true })
      }
    } catch (error) {
      console.error('Failed to update CodeBuddy usage setting:', error)
    }
  },

  setCodeBuddyUsageScope: async (scope) => {
    set({ codeBuddyUsageScope: scope })
    await get().fetchCodeBuddyUsage()
  },

  setCodeBuddyUsageRange: async (range) => {
    set({ codeBuddyUsageRange: range })
    await get().fetchCodeBuddyUsage()
  },

  fetchCodeBuddyUsage: async (options) => {
    try {
      const scanState = await window.api.codeBuddyUsage.getScanState()
      const preserveLoading =
        options?.forceRefresh === true &&
        get().codeBuddyUsageScanState?.enabled === true &&
        get().codeBuddyUsageSummary === null
      set({
        codeBuddyUsageScanState: preserveLoading
          ? { ...scanState, isScanning: true, lastScanCompletedAt: null, lastScanError: null }
          : scanState
      })
      if (!scanState.enabled) {
        return
      }

      const { codeBuddyUsageScope: scope, codeBuddyUsageRange: range } = get()
      const cached = await window.api.codeBuddyUsage.getSnapshot({ scope, range, limit: 10 })
      if (cached.scanState.lastScanCompletedAt !== null || cached.scanState.hasAnyCodeBuddyData) {
        setCodeBuddySnapshot(set, cached, options?.forceRefresh === true)
      } else {
        set({ codeBuddyUsageScanState: { ...scanState, isScanning: true, lastScanError: null } })
      }

      await window.api.codeBuddyUsage.refresh({ force: options?.forceRefresh ?? false })
      const refreshed = await window.api.codeBuddyUsage.getSnapshot({
        scope: get().codeBuddyUsageScope,
        range: get().codeBuddyUsageRange,
        limit: 10
      })
      setCodeBuddySnapshot(set, refreshed, false)
    } catch (error) {
      console.error('Failed to fetch CodeBuddy usage:', error)
    }
  },

  enableCodeBuddyUsage: async () => get().setCodeBuddyUsageEnabled(true),
  refreshCodeBuddyUsage: async () => get().fetchCodeBuddyUsage({ forceRefresh: true })
})

function setCodeBuddySnapshot(
  set: Parameters<StateCreator<AppState, [], [], CodeBuddyUsageSlice>>[0],
  snapshot: CodeBuddyUsageSnapshot,
  keepScanning: boolean
): void {
  set({
    codeBuddyUsageScanState: keepScanning
      ? { ...snapshot.scanState, isScanning: true }
      : snapshot.scanState,
    codeBuddyUsageSummary: snapshot.summary,
    codeBuddyUsageDaily: snapshot.daily,
    codeBuddyUsageModelBreakdown: snapshot.modelBreakdown,
    codeBuddyUsageProjectBreakdown: snapshot.projectBreakdown,
    codeBuddyUsageRecentSessions: snapshot.recentSessions
  })
}
