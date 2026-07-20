import { describe, expect, it } from 'vitest'
import { getDevInstanceIdentity } from './dev-instance-identity'

describe('dev-instance-identity', () => {
  it('keeps packaged identity stable', () => {
    expect(getDevInstanceIdentity(false, {})).toMatchObject({
      name: '赛博包工头',
      appName: '赛博包工头',
      isDev: false,
      devLabel: null,
      dockBadgeLabel: null,
      appUserModelId: 'com.onlyyu.sbbgt'
    })
  })

  it('keeps the safeStorage app name stable across development branches', () => {
    const a = getDevInstanceIdentity(true, { SBBGT_DEV_BRANCH: 'feature/a' })
    const b = getDevInstanceIdentity(true, { SBBGT_DEV_BRANCH: 'feature/b' })

    expect(a.name).toBe('赛博包工头')
    expect(b.name).toBe('赛博包工头')
    expect(a.appName).toBe('赛博包工头 Dev')
    expect(b.appName).toBe('赛博包工头 Dev')
    expect(a.appName).not.toBe('赛博包工头')
  })

  it('derives a readable dev label from worktree and branch env', () => {
    const identity = getDevInstanceIdentity(true, {
      ORCA_DEV_REPO_ROOT: '/repo/worktrees/dev-indicator',
      ORCA_DEV_WORKTREE_NAME: 'dev-indicator',
      ORCA_DEV_BRANCH: 'nwparker/dev-indicator'
    })

    expect(identity).toMatchObject({
      isDev: true,
      devLabel: 'dev-indicator',
      devBranch: 'nwparker/dev-indicator',
      devWorktreeName: 'dev-indicator',
      devRepoRoot: '/repo/worktrees/dev-indicator'
    })
    expect(identity.name).toBe('赛博包工头')
    expect(identity.dockBadgeLabel).toBeNull()
    expect(identity.appUserModelId).toMatch(/^com\.onlyyu\.sbbgt\.dev\.[a-f0-9]{10}$/)
  })

  it('includes the branch when it differs from the worktree basename', () => {
    const identity = getDevInstanceIdentity(true, {
      ORCA_DEV_REPO_ROOT: '/repo/worktrees/payment-ui',
      ORCA_DEV_WORKTREE_NAME: 'payment-ui',
      ORCA_DEV_BRANCH: 'feature/billing-shell'
    })

    expect(identity.devLabel).toBe('payment-ui @ feature/billing-shell')
    expect(identity.name).toBe('赛博包工头')
    expect(identity.dockBadgeLabel).toBeNull()
  })

  it('allows an explicit label override', () => {
    const identity = getDevInstanceIdentity(true, {
      ORCA_DEV_INSTANCE_LABEL: 'manual label',
      ORCA_DEV_WORKTREE_NAME: 'dev-indicator',
      ORCA_DEV_BRANCH: 'feature/other'
    })

    expect(identity.devLabel).toBe('manual label')
    expect(identity.name).toBe('赛博包工头')
    expect(identity.dockBadgeLabel).toBeNull()
  })

  it('prefers new development environment variables over legacy fallbacks', () => {
    const identity = getDevInstanceIdentity(true, {
      SBBGT_DEV_REPO_ROOT: '/repo/new',
      ORCA_DEV_REPO_ROOT: '/repo/legacy',
      SBBGT_DEV_WORKTREE_NAME: 'new-worktree',
      ORCA_DEV_WORKTREE_NAME: 'legacy-worktree',
      SBBGT_DEV_BRANCH: 'feature/new',
      ORCA_DEV_BRANCH: 'feature/legacy',
      SBBGT_DEV_INSTANCE_LABEL: 'new label',
      ORCA_DEV_INSTANCE_LABEL: 'legacy label'
    })

    expect(identity).toMatchObject({
      devRepoRoot: '/repo/new',
      devWorktreeName: 'new-worktree',
      devBranch: 'feature/new',
      devLabel: 'new label',
      name: '赛博包工头'
    })
  })

  it('keeps an explicit development app title override', () => {
    expect(
      getDevInstanceIdentity(true, {
        SBBGT_DEV_DOCK_TITLE: '赛博包工头预览',
        SBBGT_DEV_BRANCH: 'feature/preview'
      }).name
    ).toBe('赛博包工头预览')
  })
})
