import { describe, expect, it } from 'vitest'
import { pickRemoteCliEnv } from './remote-cli-env'

describe('pickRemoteCliEnv', () => {
  it('为 SSH 远端 CLI 同步新旧上下文变量', () => {
    expect(
      pickRemoteCliEnv({
        ORCA_TERMINAL_HANDLE: 'term_ssh',
        ORCA_WORKTREE_ID: 'repo::remote',
        ORCA_PANE_KEY: 'pane-1',
        ORCA_WORKSPACE_ID: 'workspace-1',
        ORCA_USER_DATA_PATH: '/tmp/orca',
        PATH: '/usr/bin',
        SECRET_TOKEN: 'nope'
      })
    ).toEqual({
      SBBGT_TERMINAL_HANDLE: 'term_ssh',
      ORCA_TERMINAL_HANDLE: 'term_ssh',
      SBBGT_WORKTREE_ID: 'repo::remote',
      ORCA_WORKTREE_ID: 'repo::remote',
      SBBGT_PANE_KEY: 'pane-1',
      ORCA_PANE_KEY: 'pane-1',
      SBBGT_WORKSPACE_ID: 'workspace-1',
      ORCA_WORKSPACE_ID: 'workspace-1',
      SBBGT_USER_DATA_PATH: '/tmp/orca',
      ORCA_USER_DATA_PATH: '/tmp/orca',
      PATH: '/usr/bin'
    })
  })

  it('新变量优先于旧变量', () => {
    expect(
      pickRemoteCliEnv({
        SBBGT_TERMINAL_HANDLE: 'new-handle',
        ORCA_TERMINAL_HANDLE: 'old-handle'
      })
    ).toMatchObject({
      SBBGT_TERMINAL_HANDLE: 'new-handle',
      ORCA_TERMINAL_HANDLE: 'new-handle'
    })
  })
})
