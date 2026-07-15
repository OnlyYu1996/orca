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
import type {
  CodeBuddyUsageDailyAggregate,
  CodeBuddyUsagePersistedState,
  CodeBuddyUsageSession
} from './types'

function getRangeCutoff(range: CodeBuddyUsageRange): string | null {
  if (range === 'all') {
    return null
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  now.setDate(now.getDate() - (days - 1))
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function localDay(timestamp: string): string | null {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function filterDaily(
  state: CodeBuddyUsagePersistedState,
  scope: CodeBuddyUsageScope,
  range: CodeBuddyUsageRange
): CodeBuddyUsageDailyAggregate[] {
  const cutoff = getRangeCutoff(range)
  return state.dailyAggregates.filter(
    (row) => (scope === 'all' || row.worktreeId !== null) && (cutoff === null || row.day >= cutoff)
  )
}

function filterSessions(
  state: CodeBuddyUsagePersistedState,
  scope: CodeBuddyUsageScope,
  range: CodeBuddyUsageRange
): CodeBuddyUsageSession[] {
  const cutoff = getRangeCutoff(range)
  return state.sessions.filter((session) => {
    if (scope === 'worktrees' && !session.primaryWorktreeId) {
      return false
    }
    const day = cutoff ? localDay(session.lastTimestamp) : null
    return cutoff === null || (day !== null && day >= cutoff)
  })
}

export function buildCodeBuddyUsageSummary(
  state: CodeBuddyUsagePersistedState,
  scope: CodeBuddyUsageScope,
  range: CodeBuddyUsageRange
): CodeBuddyUsageSummary {
  const daily = filterDaily(state, scope, range)
  const sessions = filterSessions(state, scope, range)
  const byModel = new Map<string, number>()
  const byProject = new Map<string, number>()
  let inputTokens = 0
  let cachedInputTokens = 0
  let outputTokens = 0
  let reasoningOutputTokens = 0
  let totalTokens = 0
  let events = 0
  for (const row of daily) {
    inputTokens += row.inputTokens
    cachedInputTokens += row.cachedInputTokens
    outputTokens += row.outputTokens
    reasoningOutputTokens += row.reasoningOutputTokens
    totalTokens += row.totalTokens
    events += row.eventCount
    const model = row.model ?? 'Unknown model'
    byModel.set(model, (byModel.get(model) ?? 0) + row.totalTokens)
    byProject.set(row.projectLabel, (byProject.get(row.projectLabel) ?? 0) + row.totalTokens)
  }
  const topModel = [...byModel.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const topProject = [...byProject.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  return {
    scope,
    range,
    sessions: sessions.length,
    events,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningOutputTokens,
    totalTokens,
    estimatedCostUsd: null,
    topModel,
    topProject,
    hasAnyCodeBuddyData: sessions.length > 0 || daily.length > 0
  }
}

function buildDaily(
  state: CodeBuddyUsagePersistedState,
  scope: CodeBuddyUsageScope,
  range: CodeBuddyUsageRange
): CodeBuddyUsageDailyPoint[] {
  const rows = new Map<string, CodeBuddyUsageDailyPoint>()
  for (const entry of filterDaily(state, scope, range)) {
    const row = rows.get(entry.day) ?? {
      day: entry.day,
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      reasoningOutputTokens: 0,
      totalTokens: 0
    }
    row.inputTokens += entry.inputTokens
    row.cachedInputTokens += entry.cachedInputTokens
    row.outputTokens += entry.outputTokens
    row.reasoningOutputTokens += entry.reasoningOutputTokens
    row.totalTokens += entry.totalTokens
    rows.set(entry.day, row)
  }
  return [...rows.values()].sort((a, b) => a.day.localeCompare(b.day))
}

function buildBreakdown(
  state: CodeBuddyUsagePersistedState,
  scope: CodeBuddyUsageScope,
  range: CodeBuddyUsageRange,
  kind: CodeBuddyUsageBreakdownKind
): CodeBuddyUsageBreakdownRow[] {
  const rows = new Map<string, CodeBuddyUsageBreakdownRow>()
  for (const daily of filterDaily(state, scope, range)) {
    const key = kind === 'model' ? (daily.model ?? 'unknown') : daily.projectKey
    const row = rows.get(key) ?? {
      key,
      label: kind === 'model' ? (daily.model ?? 'Unknown model') : daily.projectLabel,
      sessions: 0,
      events: 0,
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      reasoningOutputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: null
    }
    row.events += daily.eventCount
    row.inputTokens += daily.inputTokens
    row.cachedInputTokens += daily.cachedInputTokens
    row.outputTokens += daily.outputTokens
    row.reasoningOutputTokens += daily.reasoningOutputTokens
    row.totalTokens += daily.totalTokens
    rows.set(key, row)
  }
  for (const session of filterSessions(state, scope, range)) {
    const keys =
      kind === 'model'
        ? session.modelBreakdown.map((entry) => entry.modelKey)
        : session.locationBreakdown.map((entry) => entry.locationKey)
    for (const key of new Set(keys)) {
      const row = rows.get(key)
      if (row) {
        row.sessions++
      }
    }
  }
  return [...rows.values()].sort((a, b) => b.totalTokens - a.totalTokens)
}

function buildRecentSessions(
  state: CodeBuddyUsagePersistedState,
  scope: CodeBuddyUsageScope,
  range: CodeBuddyUsageRange,
  limit: number
): CodeBuddyUsageSessionRow[] {
  return filterSessions(state, scope, range)
    .slice(0, limit)
    .map((session) => ({
      sessionId: session.sessionId,
      lastActiveAt: session.lastTimestamp,
      durationMinutes: Math.max(
        0,
        Math.round(
          (new Date(session.lastTimestamp).getTime() - new Date(session.firstTimestamp).getTime()) /
            60_000
        )
      ),
      projectLabel: session.primaryProjectLabel,
      model: session.primaryModel,
      events: session.eventCount,
      inputTokens: session.totalInputTokens,
      cachedInputTokens: session.totalCachedInputTokens,
      outputTokens: session.totalOutputTokens,
      reasoningOutputTokens: session.totalReasoningOutputTokens,
      totalTokens: session.totalTokens
    }))
}

export function buildCodeBuddyUsageSnapshot(
  state: CodeBuddyUsagePersistedState,
  scanState: CodeBuddyUsageScanState,
  scope: CodeBuddyUsageScope,
  range: CodeBuddyUsageRange,
  recentSessionLimit = 10
): CodeBuddyUsageSnapshot {
  return {
    scanState,
    summary: buildCodeBuddyUsageSummary(state, scope, range),
    daily: buildDaily(state, scope, range),
    modelBreakdown: buildBreakdown(state, scope, range, 'model'),
    projectBreakdown: buildBreakdown(state, scope, range, 'project'),
    recentSessions: buildRecentSessions(state, scope, range, recentSessionLimit)
  }
}
