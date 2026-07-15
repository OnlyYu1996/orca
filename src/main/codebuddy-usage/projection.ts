import { realpath } from 'node:fs/promises'
import { basename, posix, win32 } from 'node:path'
import type { Repo } from '../../shared/types'
import { canonicalizeUsageWorktreePaths } from '../usage-worktree-canonicalizer'
import type {
  CodeBuddyUsageAttributedEvent,
  CodeBuddyUsageDailyAggregate,
  CodeBuddyUsageLocationBreakdown,
  CodeBuddyUsageModelBreakdown,
  CodeBuddyUsageParsedEvent,
  CodeBuddyUsageSession,
  CodeBuddyUsageWorktreeRef
} from './types'

type CanonicalWorktree = CodeBuddyUsageWorktreeRef & { canonicalPath: string }

function looksLikeWindowsPath(value: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(value) || value.startsWith('\\\\')
}

function normalizeFsPath(value: string): string {
  if (process.platform === 'win32' || looksLikeWindowsPath(value)) {
    return win32.normalize(win32.resolve(value)).toLowerCase()
  }
  return posix.normalize(posix.resolve(value))
}

async function canonicalizePath(value: string): Promise<string> {
  try {
    return normalizeFsPath(await realpath(value))
  } catch {
    return normalizeFsPath(value)
  }
}

function isContainingPath(parent: string, child: string): boolean {
  const useWindows = looksLikeWindowsPath(parent) || looksLikeWindowsPath(child)
  const pathApi = useWindows ? win32 : posix
  const relative = pathApi.relative(parent, child)
  return (
    relative === '' ||
    (!pathApi.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${pathApi.sep}`))
  )
}

function getDefaultProjectLabel(cwd: string | null): string {
  if (!cwd) {
    return 'Unknown location'
  }
  const parts = cwd.replace(/\\/g, '/').split('/').filter(Boolean)
  return parts.length >= 2 ? parts.slice(-2).join('/') : (parts.at(-1) ?? cwd)
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

export async function prepareCodeBuddyUsageWorktrees(
  worktrees: CodeBuddyUsageWorktreeRef[]
): Promise<CanonicalWorktree[]> {
  return canonicalizeUsageWorktreePaths(worktrees, canonicalizePath)
}

export function attributeCodeBuddyUsageEvent(
  event: CodeBuddyUsageParsedEvent,
  worktrees: CanonicalWorktree[]
): CodeBuddyUsageAttributedEvent | null {
  const day = localDay(event.timestamp)
  if (!day) {
    return null
  }
  let repoId: string | null = null
  let worktreeId: string | null = null
  let projectKey = 'unscoped'
  let projectLabel = getDefaultProjectLabel(event.cwd)
  if (event.cwd) {
    const normalizedCwd = normalizeFsPath(event.cwd)
    const worktree = worktrees.find((entry) => isContainingPath(entry.canonicalPath, normalizedCwd))
    if (worktree) {
      repoId = worktree.repoId
      worktreeId = worktree.worktreeId
      projectKey = `worktree:${worktree.worktreeId}`
      projectLabel = worktree.displayName
    } else {
      projectKey = `cwd:${normalizedCwd}`
    }
  }
  return { ...event, day, projectKey, projectLabel, repoId, worktreeId }
}

function addLocation(
  locations: CodeBuddyUsageLocationBreakdown[],
  event: CodeBuddyUsageAttributedEvent
): void {
  const row = locations.find((entry) => entry.locationKey === event.projectKey)
  if (row) {
    row.eventCount++
    row.inputTokens += event.inputTokens
    row.cachedInputTokens += event.cachedInputTokens
    row.outputTokens += event.outputTokens
    row.reasoningOutputTokens += event.reasoningOutputTokens
    row.totalTokens += event.totalTokens
    return
  }
  locations.push({
    locationKey: event.projectKey,
    projectLabel: event.projectLabel,
    repoId: event.repoId,
    worktreeId: event.worktreeId,
    eventCount: 1,
    inputTokens: event.inputTokens,
    cachedInputTokens: event.cachedInputTokens,
    outputTokens: event.outputTokens,
    reasoningOutputTokens: event.reasoningOutputTokens,
    totalTokens: event.totalTokens
  })
}

function addModel(
  models: CodeBuddyUsageModelBreakdown[],
  event: CodeBuddyUsageAttributedEvent
): void {
  const key = event.model ?? 'unknown'
  const row = models.find((entry) => entry.modelKey === key)
  if (row) {
    row.eventCount++
    row.inputTokens += event.inputTokens
    row.cachedInputTokens += event.cachedInputTokens
    row.outputTokens += event.outputTokens
    row.reasoningOutputTokens += event.reasoningOutputTokens
    row.totalTokens += event.totalTokens
    return
  }
  models.push({
    modelKey: key,
    modelLabel: event.model ?? 'Unknown model',
    eventCount: 1,
    inputTokens: event.inputTokens,
    cachedInputTokens: event.cachedInputTokens,
    outputTokens: event.outputTokens,
    reasoningOutputTokens: event.reasoningOutputTokens,
    totalTokens: event.totalTokens
  })
}

function createSession(event: CodeBuddyUsageAttributedEvent): CodeBuddyUsageSession {
  return {
    sessionId: event.sessionId,
    firstTimestamp: event.timestamp,
    lastTimestamp: event.timestamp,
    primaryModel: event.model,
    primaryProjectLabel: event.projectLabel,
    primaryWorktreeId: event.worktreeId,
    primaryRepoId: event.repoId,
    eventCount: 0,
    totalInputTokens: 0,
    totalCachedInputTokens: 0,
    totalOutputTokens: 0,
    totalReasoningOutputTokens: 0,
    totalTokens: 0,
    locationBreakdown: [],
    modelBreakdown: []
  }
}

export function aggregateCodeBuddyUsage(events: CodeBuddyUsageAttributedEvent[]): {
  sessions: CodeBuddyUsageSession[]
  dailyAggregates: CodeBuddyUsageDailyAggregate[]
} {
  const sessions = new Map<string, CodeBuddyUsageSession>()
  const daily = new Map<string, CodeBuddyUsageDailyAggregate>()
  for (const event of events) {
    const session = sessions.get(event.sessionId) ?? createSession(event)
    sessions.set(event.sessionId, session)
    session.firstTimestamp =
      event.timestamp < session.firstTimestamp ? event.timestamp : session.firstTimestamp
    session.lastTimestamp =
      event.timestamp > session.lastTimestamp ? event.timestamp : session.lastTimestamp
    session.eventCount++
    session.totalInputTokens += event.inputTokens
    session.totalCachedInputTokens += event.cachedInputTokens
    session.totalOutputTokens += event.outputTokens
    session.totalReasoningOutputTokens += event.reasoningOutputTokens
    session.totalTokens += event.totalTokens
    addLocation(session.locationBreakdown, event)
    addModel(session.modelBreakdown, event)

    const dailyKey = [event.day, event.model ?? 'unknown', event.projectKey].join('::')
    const row = daily.get(dailyKey) ?? {
      day: event.day,
      model: event.model,
      projectKey: event.projectKey,
      projectLabel: event.projectLabel,
      repoId: event.repoId,
      worktreeId: event.worktreeId,
      eventCount: 0,
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      reasoningOutputTokens: 0,
      totalTokens: 0
    }
    daily.set(dailyKey, row)
    row.eventCount++
    row.inputTokens += event.inputTokens
    row.cachedInputTokens += event.cachedInputTokens
    row.outputTokens += event.outputTokens
    row.reasoningOutputTokens += event.reasoningOutputTokens
    row.totalTokens += event.totalTokens
  }
  for (const session of sessions.values()) {
    session.locationBreakdown.sort((a, b) => b.totalTokens - a.totalTokens)
    session.modelBreakdown.sort((a, b) => b.totalTokens - a.totalTokens)
    const location = session.locationBreakdown[0]
    const model = session.modelBreakdown[0]
    session.primaryProjectLabel = location?.projectLabel ?? 'Unknown location'
    session.primaryWorktreeId = location?.worktreeId ?? null
    session.primaryRepoId = location?.repoId ?? null
    session.primaryModel = model?.modelLabel ?? null
  }
  return {
    sessions: [...sessions.values()].sort((a, b) => b.lastTimestamp.localeCompare(a.lastTimestamp)),
    dailyAggregates: [...daily.values()].sort((a, b) =>
      a.day === b.day ? a.projectLabel.localeCompare(b.projectLabel) : a.day.localeCompare(b.day)
    )
  }
}

export function createCodeBuddyWorktreeRefs(
  repos: Repo[],
  worktreesByRepo: Map<string, { path: string; worktreeId: string; displayName: string }[]>
): CodeBuddyUsageWorktreeRef[] {
  return repos.flatMap((repo) =>
    (worktreesByRepo.get(repo.id) ?? []).map((worktree) => ({ repoId: repo.id, ...worktree }))
  )
}

export function getCodeBuddyUsageWorktreeFingerprint(
  worktreesByRepo: Map<string, { path: string; worktreeId: string; displayName: string }[]>
): string {
  return JSON.stringify(
    [...worktreesByRepo.entries()]
      .flatMap(([repoId, rows]) => rows.map((row) => JSON.stringify({ repoId, ...row })))
      .sort()
  )
}

export function getDefaultCodeBuddyWorktreeLabel(pathValue: string): string {
  return basename(pathValue)
}
