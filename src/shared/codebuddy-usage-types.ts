export type CodeBuddyUsageScope = 'worktrees' | 'all'
export type CodeBuddyUsageRange = '7d' | '30d' | '90d' | 'all'
export type CodeBuddyUsageBreakdownKind = 'model' | 'project'

export type CodeBuddyUsageScanState = {
  enabled: boolean
  isScanning: boolean
  lastScanStartedAt: number | null
  lastScanCompletedAt: number | null
  lastScanError: string | null
  hasAnyCodeBuddyData: boolean
}

export type CodeBuddyUsageSummary = {
  scope: CodeBuddyUsageScope
  range: CodeBuddyUsageRange
  sessions: number
  events: number
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
  estimatedCostUsd: number | null
  topModel: string | null
  topProject: string | null
  hasAnyCodeBuddyData: boolean
}

export type CodeBuddyUsageDailyPoint = {
  day: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
}

export type CodeBuddyUsageBreakdownRow = {
  key: string
  label: string
  sessions: number
  events: number
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
  estimatedCostUsd: number | null
}

export type CodeBuddyUsageSessionRow = {
  sessionId: string
  lastActiveAt: string
  durationMinutes: number
  projectLabel: string
  model: string | null
  events: number
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
}

export type CodeBuddyUsageSnapshot = {
  scanState: CodeBuddyUsageScanState
  summary: CodeBuddyUsageSummary
  daily: CodeBuddyUsageDailyPoint[]
  modelBreakdown: CodeBuddyUsageBreakdownRow[]
  projectBreakdown: CodeBuddyUsageBreakdownRow[]
  recentSessions: CodeBuddyUsageSessionRow[]
}
