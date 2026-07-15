export type CodeBuddyUsageProcessedFile = {
  path: string
  mtimeMs: number
  size: number
  lineCount: number
}

export type CodeBuddyUsageWorktreeRef = {
  repoId: string
  worktreeId: string
  path: string
  displayName: string
}

export type CodeBuddyUsageLocationBreakdown = {
  locationKey: string
  projectLabel: string
  repoId: string | null
  worktreeId: string | null
  eventCount: number
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
}

export type CodeBuddyUsageModelBreakdown = {
  modelKey: string
  modelLabel: string
  eventCount: number
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
}

export type CodeBuddyUsageSession = {
  sessionId: string
  firstTimestamp: string
  lastTimestamp: string
  primaryModel: string | null
  primaryProjectLabel: string
  primaryWorktreeId: string | null
  primaryRepoId: string | null
  eventCount: number
  totalInputTokens: number
  totalCachedInputTokens: number
  totalOutputTokens: number
  totalReasoningOutputTokens: number
  totalTokens: number
  locationBreakdown: CodeBuddyUsageLocationBreakdown[]
  modelBreakdown: CodeBuddyUsageModelBreakdown[]
}

export type CodeBuddyUsageDailyAggregate = {
  day: string
  model: string | null
  projectKey: string
  projectLabel: string
  repoId: string | null
  worktreeId: string | null
  eventCount: number
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
}

export type CodeBuddyUsageParsedEvent = {
  eventId: string
  sessionId: string
  timestamp: string
  model: string | null
  cwd: string | null
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
}

export type CodeBuddyUsageAttributedEvent = CodeBuddyUsageParsedEvent & {
  day: string
  projectKey: string
  projectLabel: string
  repoId: string | null
  worktreeId: string | null
}

export type CodeBuddyUsagePersistedFile = CodeBuddyUsageProcessedFile & {
  events: CodeBuddyUsageAttributedEvent[]
  ownedEventIds: string[]
  hasDeferredClaims: boolean
}

export type CodeBuddyUsagePersistedState = {
  schemaVersion: number
  worktreeFingerprint: string | null
  processedFiles: CodeBuddyUsagePersistedFile[]
  sessions: CodeBuddyUsageSession[]
  dailyAggregates: CodeBuddyUsageDailyAggregate[]
  scanState: {
    enabled: boolean
    lastScanStartedAt: number | null
    lastScanCompletedAt: number | null
    lastScanError: string | null
  }
}
