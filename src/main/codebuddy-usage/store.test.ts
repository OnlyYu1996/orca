import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getPathMock } = vi.hoisted(() => ({ getPathMock: vi.fn(() => '/tmp/codebuddy-usage') }))

vi.mock('electron', () => ({ app: { getPath: getPathMock } }))

import { CodeBuddyUsageStore, initCodeBuddyUsagePath } from './store'

let directories: string[] = []

beforeEach(() => {
  const userData = mkdtempSync(join(tmpdir(), 'codebuddy-usage-store-'))
  directories.push(userData)
  getPathMock.mockReturnValue(userData)
  initCodeBuddyUsagePath()
})

afterEach(() => {
  for (const directory of directories) {
    rmSync(directory, { recursive: true, force: true })
  }
  directories = []
})

describe('CodeBuddyUsageStore', () => {
  it('persists opt-in state and scans local project transcripts', async () => {
    const projects = mkdtempSync(join(tmpdir(), 'codebuddy-projects-'))
    directories.push(projects)
    writeFileSync(
      join(projects, 'session-1.jsonl'),
      JSON.stringify({
        id: 'message-1',
        timestamp: 1_777_777_800_000,
        sessionId: 'session-1',
        cwd: '/workspace/repo',
        providerData: {
          messageId: 'message-1',
          requestModelName: 'GLM-5.1',
          rawUsage: {
            prompt_tokens: 1_000,
            completion_tokens: 250,
            prompt_tokens_details: { cached_tokens: 400 }
          }
        }
      })
    )
    const source = {
      getRepos: () => [
        { id: 'repo-1', path: '/workspace/repo', displayName: 'Repo', connectionId: null }
      ],
      getAllWorktreeMeta: () => ({})
    }
    const store = new CodeBuddyUsageStore(source as never, projects)
    expect(store.getScanState().enabled).toBe(false)

    await store.setEnabled(true)
    await store.refresh(true)
    const snapshot = store.getSnapshot('all', 'all')
    expect(snapshot.summary).toMatchObject({
      sessions: 1,
      events: 1,
      inputTokens: 1_000,
      cachedInputTokens: 400,
      outputTokens: 250,
      totalTokens: 1_250,
      estimatedCostUsd: null,
      topModel: 'GLM-5.1'
    })
    expect(snapshot.projectBreakdown[0]).toMatchObject({ label: 'Repo', sessions: 1 })

    const restored = new CodeBuddyUsageStore(source as never, projects)
    expect(restored.getScanState()).toMatchObject({ enabled: true, hasAnyCodeBuddyData: true })
  })
})
