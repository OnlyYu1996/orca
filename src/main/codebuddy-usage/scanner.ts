import { stat } from 'node:fs/promises'
import {
  aggregateCodeBuddyUsage,
  attributeCodeBuddyUsageEvent,
  prepareCodeBuddyUsageWorktrees
} from './projection'
import { listCodeBuddyTranscriptFiles, readCodeBuddyUsageFile } from './source-record'
import type {
  CodeBuddyUsageAttributedEvent,
  CodeBuddyUsagePersistedFile,
  CodeBuddyUsageProcessedFile,
  CodeBuddyUsageWorktreeRef
} from './types'

const FILE_SCAN_BATCH_SIZE = 4

async function yieldToEventLoop(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

async function getProcessedFileStat(
  filePath: string
): Promise<Omit<CodeBuddyUsageProcessedFile, 'lineCount'>> {
  const fileStat = await stat(filePath)
  return { path: filePath, mtimeMs: fileStat.mtimeMs, size: fileStat.size }
}

function canReuseProcessedFile(
  previous: CodeBuddyUsagePersistedFile | undefined,
  current: Omit<CodeBuddyUsageProcessedFile, 'lineCount'>,
  mustReclaimDeferred: boolean
): previous is CodeBuddyUsagePersistedFile {
  return Boolean(
    !mustReclaimDeferred &&
    previous &&
    previous.mtimeMs === current.mtimeMs &&
    previous.size === current.size &&
    Array.isArray(previous.events) &&
    Array.isArray(previous.ownedEventIds) &&
    typeof previous.hasDeferredClaims === 'boolean'
  )
}

function registerCachedOwnership(
  reusedByPath: Map<string, CodeBuddyUsagePersistedFile>
): Map<string, string> {
  const ownerByEventId = new Map<string, string>()
  for (const [filePath, file] of reusedByPath) {
    for (const eventId of file.ownedEventIds) {
      if (!ownerByEventId.has(eventId)) {
        ownerByEventId.set(eventId, filePath)
      }
    }
  }
  return ownerByEventId
}

async function partitionReusableFiles(
  files: string[],
  previousByPath: Map<string, CodeBuddyUsagePersistedFile>,
  lostOwner: boolean
): Promise<{
  reusedByPath: Map<string, CodeBuddyUsagePersistedFile>
  pathsToParse: string[]
}> {
  const reusedByPath = new Map<string, CodeBuddyUsagePersistedFile>()
  const pathsToParse: string[] = []
  for (let index = 0; index < files.length; index += FILE_SCAN_BATCH_SIZE) {
    const batch = files.slice(index, index + FILE_SCAN_BATCH_SIZE)
    const reusable = await Promise.all(
      batch.map(async (filePath) => {
        const current = await getProcessedFileStat(filePath)
        const previous = previousByPath.get(filePath)
        const mustReclaimDeferred = lostOwner && previous?.hasDeferredClaims !== false
        return canReuseProcessedFile(previous, current, mustReclaimDeferred) ? previous : null
      })
    )
    for (const [batchIndex, previous] of reusable.entries()) {
      const filePath = batch[batchIndex]
      if (previous) {
        reusedByPath.set(filePath, previous)
      } else {
        pathsToParse.push(filePath)
      }
    }
    if (index + batch.length < files.length) {
      await yieldToEventLoop()
    }
  }
  return { reusedByPath, pathsToParse }
}

async function parseChangedFiles(
  paths: string[],
  ownerByEventId: Map<string, string>,
  worktrees: Awaited<ReturnType<typeof prepareCodeBuddyUsageWorktrees>>
): Promise<Map<string, CodeBuddyUsagePersistedFile>> {
  const parsedByPath = new Map<string, CodeBuddyUsagePersistedFile>()
  for (let index = 0; index < paths.length; index += FILE_SCAN_BATCH_SIZE) {
    const batch = paths.slice(index, index + FILE_SCAN_BATCH_SIZE)
    const reads = await Promise.all(batch.map(readCodeBuddyUsageFile))
    for (const [batchIndex, filePath] of batch.entries()) {
      const { processedFile, events } = reads[batchIndex]
      const ownedEvents: CodeBuddyUsageAttributedEvent[] = []
      const ownedEventIds: string[] = []
      let hasDeferredClaims = false
      for (const event of events) {
        const owner = ownerByEventId.get(event.eventId)
        if (owner !== undefined && owner !== filePath) {
          hasDeferredClaims = true
          continue
        }
        ownerByEventId.set(event.eventId, filePath)
        ownedEventIds.push(event.eventId)
        const attributed = attributeCodeBuddyUsageEvent(event, worktrees)
        if (attributed) {
          ownedEvents.push(attributed)
        }
      }
      parsedByPath.set(filePath, {
        ...processedFile,
        events: ownedEvents,
        ownedEventIds,
        hasDeferredClaims
      })
    }
    if (index + batch.length < paths.length) {
      await yieldToEventLoop()
    }
  }
  return parsedByPath
}

export async function scanCodeBuddyUsageFiles(
  worktreeRefs: CodeBuddyUsageWorktreeRef[],
  previousProcessedFiles: CodeBuddyUsagePersistedFile[] = [],
  projectsDirectory?: string
): Promise<{
  processedFiles: CodeBuddyUsagePersistedFile[]
  sessions: ReturnType<typeof aggregateCodeBuddyUsage>['sessions']
  dailyAggregates: ReturnType<typeof aggregateCodeBuddyUsage>['dailyAggregates']
}> {
  const files = await listCodeBuddyTranscriptFiles(projectsDirectory)
  const previousByPath = new Map(previousProcessedFiles.map((file) => [file.path, file]))
  const currentPaths = new Set(files)
  // 删除持有去重键的文件后，只让曾经延迟认领的文件重新解析，避免全量重扫大型历史目录。
  const lostOwner = previousProcessedFiles.some(
    (file) => !currentPaths.has(file.path) && file.ownedEventIds.length > 0
  )
  const { reusedByPath, pathsToParse } = await partitionReusableFiles(
    files,
    previousByPath,
    lostOwner
  )
  const ownerByEventId = registerCachedOwnership(reusedByPath)
  const worktrees = await prepareCodeBuddyUsageWorktrees(worktreeRefs)
  const parsedByPath = await parseChangedFiles(pathsToParse, ownerByEventId, worktrees)

  const processedFiles: CodeBuddyUsagePersistedFile[] = []
  const events: CodeBuddyUsageAttributedEvent[] = []
  for (const filePath of files) {
    const processed = reusedByPath.get(filePath) ?? parsedByPath.get(filePath)
    if (!processed) {
      continue
    }
    processedFiles.push(processed)
    events.push(...processed.events)
  }
  return { processedFiles, ...aggregateCodeBuddyUsage(events) }
}
