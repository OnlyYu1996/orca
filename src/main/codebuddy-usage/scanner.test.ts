import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { scanCodeBuddyUsageFiles } from './scanner'
import { parseCodeBuddyUsageRecord, readCodeBuddyUsageFile } from './source-record'

const WORKTREE = '/workspace/repo'
const tempDirectories: string[] = []

function createTempDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'codebuddy-usage-'))
  tempDirectories.push(directory)
  return directory
}

function usageRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'message-1',
    timestamp: 1_777_777_800_000,
    sessionId: 'session-1',
    cwd: `${WORKTREE}/packages/app`,
    providerData: {
      messageId: 'message-1',
      requestModelId: 'glm-5.1',
      requestModelName: 'GLM-5.1',
      rawUsage: {
        prompt_tokens: 1_000,
        completion_tokens: 250,
        prompt_tokens_details: { cached_tokens: 400 },
        completion_tokens_details: { reasoning_tokens: 100 }
      }
    },
    ...overrides
  }
}

function writeJsonl(path: string, records: unknown[]): void {
  writeFileSync(path, records.map((record) => JSON.stringify(record)).join('\n'))
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('CodeBuddy usage source records', () => {
  it('parses raw usage without adding cache or reasoning twice', () => {
    expect(parseCodeBuddyUsageRecord(JSON.stringify(usageRecord()))).toEqual({
      eventId: 'message-1',
      sessionId: 'session-1',
      timestamp: new Date(1_777_777_800_000).toISOString(),
      model: 'GLM-5.1',
      cwd: `${WORKTREE}/packages/app`,
      inputTokens: 1_000,
      cachedInputTokens: 400,
      outputTokens: 250,
      reasoningOutputTokens: 100,
      totalTokens: 1_250
    })
  })

  it('falls back to message usage when raw usage is absent', () => {
    const parsed = parseCodeBuddyUsageRecord(
      JSON.stringify({
        id: 'message-2',
        timestamp: '2026-04-09T10:00:00.000Z',
        sessionId: 'session-2',
        message: {
          model: 'hunyuan',
          usage: {
            input_tokens: 100,
            output_tokens: 20,
            cache_read_input_tokens: 40
          }
        }
      })
    )
    expect(parsed).toMatchObject({
      eventId: 'message-2',
      model: 'hunyuan',
      inputTokens: 100,
      cachedInputTokens: 40,
      outputTokens: 20,
      totalTokens: 120
    })
  })

  it('ignores malformed lines and valid JSON values that are not records', () => {
    expect(parseCodeBuddyUsageRecord('{broken')).toBeNull()
    expect(parseCodeBuddyUsageRecord('null')).toBeNull()
    expect(parseCodeBuddyUsageRecord('[]')).toBeNull()
    expect(parseCodeBuddyUsageRecord(JSON.stringify('message'))).toBeNull()
  })

  it('keeps the most complete copy of a repeated event inside one file', async () => {
    const directory = createTempDirectory()
    const file = join(directory, 'session.jsonl')
    writeJsonl(file, [
      usageRecord(),
      usageRecord({
        providerData: {
          messageId: 'message-1',
          requestModelName: 'GLM-5.1',
          rawUsage: { prompt_tokens: 1_200, completion_tokens: 300 }
        }
      })
    ])
    const result = await readCodeBuddyUsageFile(file)
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({ inputTokens: 1_200, outputTokens: 300 })
  })
})

describe('CodeBuddy usage scanning', () => {
  it('discovers subagent logs, ignores corrupt rows, and deduplicates copied events', async () => {
    const projects = createTempDirectory()
    const sessionDirectory = join(projects, 'project', 'session-1')
    const subagentsDirectory = join(sessionDirectory, 'subagents')
    mkdirSync(subagentsDirectory, { recursive: true })
    writeJsonl(join(projects, 'project', 'session-1.jsonl'), [usageRecord(), 'not-json'])
    writeJsonl(join(subagentsDirectory, 'agent-1.jsonl'), [
      usageRecord({ sessionId: 'subagent-1' }),
      usageRecord({
        id: 'message-2',
        sessionId: 'subagent-1',
        providerData: {
          messageId: 'message-2',
          requestModelName: 'GLM-5.1',
          rawUsage: { prompt_tokens: 200, completion_tokens: 50 }
        }
      })
    ])

    const first = await scanCodeBuddyUsageFiles(
      [
        {
          repoId: 'repo-1',
          worktreeId: `repo-1::${WORKTREE}`,
          path: WORKTREE,
          displayName: 'Repo'
        }
      ],
      [],
      projects
    )
    expect(first.processedFiles).toHaveLength(2)
    expect(first.sessions.reduce((sum, session) => sum + session.eventCount, 0)).toBe(2)
    expect(first.dailyAggregates.reduce((sum, row) => sum + row.totalTokens, 0)).toBe(1_500)
    expect(first.dailyAggregates.every((row) => row.worktreeId !== null)).toBe(true)

    const second = await scanCodeBuddyUsageFiles(
      [
        {
          repoId: 'repo-1',
          worktreeId: `repo-1::${WORKTREE}`,
          path: WORKTREE,
          displayName: 'Repo'
        }
      ],
      first.processedFiles,
      projects
    )
    expect(second).toEqual(first)
  })
})
