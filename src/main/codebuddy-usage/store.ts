import type {
  CodeBuddyUsageBreakdownKind,
  CodeBuddyUsageBreakdownRow,
  CodeBuddyUsageDailyPoint,
  CodeBuddyUsageRange,
  CodeBuddyUsageScanState,
  CodeBuddyUsageScope,
  CodeBuddyUsageSessionRow,
  CodeBuddyUsageSnapshot,
  CodeBuddyUsageSummary
} from '../../shared/codebuddy-usage-types'
import type { Store } from '../persistence'
import { loadKnownUsageWorktreesByRepo } from '../usage-worktree-metadata'
import { createCodeBuddyWorktreeRefs, getCodeBuddyUsageWorktreeFingerprint } from './projection'
import {
  initCodeBuddyUsagePath,
  loadCodeBuddyUsageState,
  writeCodeBuddyUsageState
} from './persistence'
import { scanCodeBuddyUsageFiles } from './scanner'
import { buildCodeBuddyUsageSnapshot, buildCodeBuddyUsageSummary } from './snapshot'
import type { CodeBuddyUsagePersistedState } from './types'

const STALE_MS = 5 * 60_000

type CodeBuddyUsageStoreSource = Pick<Store, 'getRepos' | 'getAllWorktreeMeta'>

export { initCodeBuddyUsagePath }

export class CodeBuddyUsageStore {
  private state: CodeBuddyUsagePersistedState
  private scanPromise: Promise<void> | null = null

  constructor(
    private readonly store: CodeBuddyUsageStoreSource,
    private readonly projectsDirectory?: string
  ) {
    this.state = loadCodeBuddyUsageState()
  }

  async setEnabled(enabled: boolean): Promise<CodeBuddyUsageScanState> {
    this.state.scanState.enabled = enabled
    writeCodeBuddyUsageState(this.state)
    return this.getScanState()
  }

  getScanState(): CodeBuddyUsageScanState {
    return {
      ...this.state.scanState,
      isScanning: this.scanPromise !== null,
      hasAnyCodeBuddyData: this.state.sessions.length > 0 || this.state.dailyAggregates.length > 0
    }
  }

  getSnapshot(
    scope: CodeBuddyUsageScope,
    range: CodeBuddyUsageRange,
    recentSessionLimit = 10
  ): CodeBuddyUsageSnapshot {
    return buildCodeBuddyUsageSnapshot(
      this.state,
      this.getScanState(),
      scope,
      range,
      recentSessionLimit
    )
  }

  async refresh(force = false): Promise<CodeBuddyUsageScanState> {
    if (!this.state.scanState.enabled) {
      return this.getScanState()
    }
    const fingerprint = this.getCurrentWorktreeFingerprint()
    const completedAt = this.state.scanState.lastScanCompletedAt
    if (
      !force &&
      completedAt !== null &&
      Date.now() - completedAt < STALE_MS &&
      fingerprint === this.state.worktreeFingerprint
    ) {
      return this.getScanState()
    }
    await this.runScan(fingerprint)
    return this.getScanState()
  }

  private async runScan(worktreeFingerprint: string): Promise<void> {
    if (this.scanPromise) {
      await this.scanPromise
      return
    }
    this.state.scanState.lastScanStartedAt = Date.now()
    this.state.scanState.lastScanError = null
    writeCodeBuddyUsageState(this.state)
    this.scanPromise = this.scan(worktreeFingerprint)
    await this.scanPromise
  }

  private async scan(worktreeFingerprint: string): Promise<void> {
    try {
      const repos = this.store.getRepos()
      const worktreesByRepo = loadKnownUsageWorktreesByRepo(this.store, repos)
      const result = await scanCodeBuddyUsageFiles(
        createCodeBuddyWorktreeRefs(repos, worktreesByRepo),
        this.state.worktreeFingerprint === worktreeFingerprint ? this.state.processedFiles : [],
        this.projectsDirectory
      )
      this.state.processedFiles = result.processedFiles
      this.state.sessions = result.sessions
      this.state.dailyAggregates = result.dailyAggregates
      this.state.worktreeFingerprint = worktreeFingerprint
      this.state.scanState.lastScanCompletedAt = Date.now()
      this.state.scanState.lastScanError = null
    } catch (error) {
      this.state.scanState.lastScanError = error instanceof Error ? error.message : String(error)
    } finally {
      this.scanPromise = null
      writeCodeBuddyUsageState(this.state)
    }
  }

  async getSummary(
    scope: CodeBuddyUsageScope,
    range: CodeBuddyUsageRange
  ): Promise<CodeBuddyUsageSummary> {
    await this.refresh(false)
    return buildCodeBuddyUsageSummary(this.state, scope, range)
  }

  async getDaily(
    scope: CodeBuddyUsageScope,
    range: CodeBuddyUsageRange
  ): Promise<CodeBuddyUsageDailyPoint[]> {
    await this.refresh(false)
    return this.getSnapshot(scope, range).daily
  }

  async getBreakdown(
    scope: CodeBuddyUsageScope,
    range: CodeBuddyUsageRange,
    kind: CodeBuddyUsageBreakdownKind
  ): Promise<CodeBuddyUsageBreakdownRow[]> {
    await this.refresh(false)
    const snapshot = this.getSnapshot(scope, range)
    return kind === 'model' ? snapshot.modelBreakdown : snapshot.projectBreakdown
  }

  async getRecentSessions(
    scope: CodeBuddyUsageScope,
    range: CodeBuddyUsageRange,
    limit = 10
  ): Promise<CodeBuddyUsageSessionRow[]> {
    await this.refresh(false)
    return this.getSnapshot(scope, range, limit).recentSessions
  }

  private getCurrentWorktreeFingerprint(): string {
    const repos = this.store.getRepos()
    return getCodeBuddyUsageWorktreeFingerprint(loadKnownUsageWorktreesByRepo(this.store, repos))
  }
}
