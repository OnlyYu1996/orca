import { beforeEach, describe, expect, it, vi } from 'vitest'

const { handlers } = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>()
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler)
    })
  }
}))

import { registerCodeBuddyUsageHandlers } from './codebuddy-usage'

describe('CodeBuddy usage IPC', () => {
  beforeEach(() => handlers.clear())

  it('registers the complete usage query surface', async () => {
    const store = {
      getScanState: vi.fn(() => ({ enabled: true })),
      setEnabled: vi.fn(() => ({ enabled: true })),
      refresh: vi.fn(() => ({ enabled: true })),
      getSnapshot: vi.fn(() => ({ summary: { totalTokens: 10 } })),
      getSummary: vi.fn(() => ({ totalTokens: 10 })),
      getDaily: vi.fn(() => []),
      getBreakdown: vi.fn(() => []),
      getRecentSessions: vi.fn(() => [])
    }
    registerCodeBuddyUsageHandlers(store as never)

    expect([...handlers.keys()].sort()).toEqual(
      [
        'codeBuddyUsage:getBreakdown',
        'codeBuddyUsage:getDaily',
        'codeBuddyUsage:getRecentSessions',
        'codeBuddyUsage:getScanState',
        'codeBuddyUsage:getSnapshot',
        'codeBuddyUsage:getSummary',
        'codeBuddyUsage:refresh',
        'codeBuddyUsage:setEnabled'
      ].sort()
    )
    await handlers.get('codeBuddyUsage:getSnapshot')?.({}, { scope: 'all', range: 'all' })
    expect(store.getSnapshot).toHaveBeenCalledWith('all', 'all', undefined)
  })
})
