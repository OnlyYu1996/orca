import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'
import { createInterface } from 'node:readline'
import type { CodeBuddyUsageParsedEvent, CodeBuddyUsageProcessedFile } from './types'

type UsageRecord = Record<string, unknown>

type CodeBuddySourceRecord = {
  id?: unknown
  timestamp?: unknown
  sessionId?: unknown
  cwd?: unknown
  message?: {
    model?: unknown
    usage?: UsageRecord
  }
  providerData?: {
    messageId?: unknown
    model?: unknown
    requestModelId?: unknown
    requestModelName?: unknown
    rawUsage?: UsageRecord
  }
}

export type CodeBuddyUsageFileReadResult = {
  processedFile: CodeBuddyUsageProcessedFile
  events: CodeBuddyUsageParsedEvent[]
}

function asRecord(value: unknown): UsageRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UsageRecord)
    : null
}

function readRecord(record: UsageRecord | null, key: string): unknown {
  return record?.[key]
}

function readNestedRecord(record: UsageRecord | null, key: string): UsageRecord | null {
  return asRecord(readRecord(record, key))
}

function readTokenCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeTimestamp(value: unknown): string | null {
  let timestamp: number | string
  if (typeof value === 'number' && Number.isFinite(value)) {
    timestamp = value < 1_000_000_000_000 ? value * 1000 : value
  } else if (typeof value === 'string' && value.trim()) {
    timestamp = value.trim()
  } else {
    return null
  }
  const parsed = new Date(timestamp)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function resolveCachedInputTokens(
  rawUsage: UsageRecord | null,
  messageUsage: UsageRecord | null
): number {
  const promptDetails = readNestedRecord(rawUsage, 'prompt_tokens_details')
  return Math.max(
    readTokenCount(readRecord(promptDetails, 'cached_tokens')),
    readTokenCount(readRecord(rawUsage, 'prompt_cache_hit_tokens')),
    readTokenCount(readRecord(rawUsage, 'cache_read_input_tokens')),
    readTokenCount(readRecord(rawUsage, 'cached_tokens')),
    readTokenCount(readRecord(messageUsage, 'cache_read_input_tokens'))
  )
}

function resolveReasoningOutputTokens(rawUsage: UsageRecord | null): number {
  const completionDetails = readNestedRecord(rawUsage, 'completion_tokens_details')
  return Math.max(
    readTokenCount(readRecord(completionDetails, 'reasoning_tokens')),
    readTokenCount(readRecord(rawUsage, 'completion_thinking_tokens'))
  )
}

function buildFallbackEventId(
  sessionId: string,
  timestamp: string,
  model: string | null,
  inputTokens: number,
  outputTokens: number
): string {
  return [sessionId, timestamp, model ?? 'unknown', inputTokens, outputTokens].join(':')
}

function mergeRepeatedEvent(
  current: CodeBuddyUsageParsedEvent,
  candidate: CodeBuddyUsageParsedEvent
): CodeBuddyUsageParsedEvent {
  const inputTokens = Math.max(current.inputTokens, candidate.inputTokens)
  const outputTokens = Math.max(current.outputTokens, candidate.outputTokens)
  return {
    ...current,
    timestamp: candidate.timestamp > current.timestamp ? candidate.timestamp : current.timestamp,
    model: candidate.model ?? current.model,
    cwd: candidate.cwd ?? current.cwd,
    inputTokens,
    cachedInputTokens: Math.min(
      inputTokens,
      Math.max(current.cachedInputTokens, candidate.cachedInputTokens)
    ),
    outputTokens,
    reasoningOutputTokens: Math.min(
      outputTokens,
      Math.max(current.reasoningOutputTokens, candidate.reasoningOutputTokens)
    ),
    totalTokens: inputTokens + outputTokens
  }
}

export function parseCodeBuddyUsageRecord(
  line: string,
  fallbackSessionId: string | null = null
): CodeBuddyUsageParsedEvent | null {
  let parsed: CodeBuddySourceRecord
  try {
    const parsedRecord = asRecord(JSON.parse(line))
    if (!parsedRecord) {
      return null
    }
    parsed = parsedRecord as CodeBuddySourceRecord
  } catch {
    return null
  }

  const providerData = asRecord(parsed.providerData)
  const message = asRecord(parsed.message)
  const rawUsage = readNestedRecord(providerData, 'rawUsage')
  const messageUsage = readNestedRecord(message, 'usage')
  if (!rawUsage && !messageUsage) {
    return null
  }

  const sessionId = readString(parsed.sessionId) ?? fallbackSessionId
  const timestamp = normalizeTimestamp(parsed.timestamp)
  if (!sessionId || !timestamp) {
    return null
  }

  const inputTokens = readTokenCount(
    readRecord(rawUsage, 'prompt_tokens') ?? readRecord(messageUsage, 'input_tokens')
  )
  const outputTokens = readTokenCount(
    readRecord(rawUsage, 'completion_tokens') ?? readRecord(messageUsage, 'output_tokens')
  )
  if (inputTokens + outputTokens <= 0) {
    return null
  }

  const model =
    readString(readRecord(providerData, 'requestModelName')) ??
    readString(readRecord(providerData, 'requestModelId')) ??
    readString(readRecord(providerData, 'model')) ??
    readString(readRecord(message, 'model'))
  const eventId =
    readString(readRecord(providerData, 'messageId')) ??
    readString(parsed.id) ??
    buildFallbackEventId(sessionId, timestamp, model, inputTokens, outputTokens)

  return {
    eventId,
    sessionId,
    timestamp,
    model,
    cwd: readString(parsed.cwd),
    inputTokens,
    cachedInputTokens: Math.min(inputTokens, resolveCachedInputTokens(rawUsage, messageUsage)),
    outputTokens,
    reasoningOutputTokens: Math.min(outputTokens, resolveReasoningOutputTokens(rawUsage)),
    totalTokens: inputTokens + outputTokens
  }
}

async function walkJsonlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      for (const nestedFile of await walkJsonlFiles(path)) {
        files.push(nestedFile)
      }
    } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
      files.push(path)
    }
  }
  return files
}

export async function listCodeBuddyTranscriptFiles(
  projectsDirectory = join(homedir(), '.codebuddy', 'projects')
): Promise<string[]> {
  try {
    return (await walkJsonlFiles(projectsDirectory)).sort()
  } catch {
    return []
  }
}

export async function readCodeBuddyUsageFile(
  filePath: string
): Promise<CodeBuddyUsageFileReadResult> {
  const fileStat = await stat(filePath)
  const fallbackSessionId = basename(filePath, '.jsonl')
  const eventsById = new Map<string, CodeBuddyUsageParsedEvent>()
  let lineCount = 0
  const lines = createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity
  })
  for await (const line of lines) {
    lineCount++
    const event = parseCodeBuddyUsageRecord(line, fallbackSessionId)
    if (!event) {
      continue
    }
    const current = eventsById.get(event.eventId)
    eventsById.set(event.eventId, current ? mergeRepeatedEvent(current, event) : event)
  }
  return {
    processedFile: {
      path: filePath,
      mtimeMs: fileStat.mtimeMs,
      size: fileStat.size,
      lineCount
    },
    events: [...eventsById.values()]
  }
}
