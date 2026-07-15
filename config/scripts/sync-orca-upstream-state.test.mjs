import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  auditRepository,
  parseAuditArguments
} from '../../skills/sync-orca-upstream/scripts/audit-upstream.mjs'
import {
  parseRecordArguments,
  recordUpstreamIntegration
} from '../../skills/sync-orca-upstream/scripts/record-upstream-integration.mjs'
import {
  createUpstreamIntegrationState,
  parseUpstreamIntegrationState,
  validateUpstreamIntegrationState
} from '../../skills/sync-orca-upstream/scripts/upstream-integration-state.mjs'

const projectDir = resolve(import.meta.dirname, '../..')
const statePath = resolve(
  projectDir,
  'skills/sync-orca-upstream/references/upstream-integration-state.json'
)
const skillPath = resolve(projectDir, 'skills/sync-orca-upstream/SKILL.md')

const integration = {
  branch: 'main',
  preSyncHead: '1'.repeat(40),
  upstreamTargetSha: '2'.repeat(40),
  mergeBase: '3'.repeat(40),
  strategy: 'merge',
  integrationCommit: '4'.repeat(40),
  integratedAt: '2026-07-15T09:42:17+08:00',
  postSyncFetchedSha: '5'.repeat(40),
  pendingUpstreamCommitCountAtRecord: 2
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

describe('上游集成状态', () => {
  it('接受仓库中已记录的最后成功同步状态', () => {
    const state = parseUpstreamIntegrationState(readFileSync(statePath, 'utf8'))

    expect(state.lastSuccessfulIntegration.upstreamTargetSha).toBe(
      '6ee2af357b82c8717ad633f1251b6b310486dd7d'
    )
    expect(validateUpstreamIntegrationState(state)).toEqual([])
  })

  it('拒绝缩写 SHA 和未通过验证的同步记录', () => {
    const state = createUpstreamIntegrationState(integration)
    state.lastSuccessfulIntegration.upstreamTargetSha = 'abc1234'
    state.lastSuccessfulIntegration.verificationStatus = 'pending'

    expect(validateUpstreamIntegrationState(state)).toEqual(
      expect.arrayContaining([
        'lastSuccessfulIntegration.upstreamTargetSha 必须是 40 位小写 Git SHA',
        'lastSuccessfulIntegration.verificationStatus 必须为 passed'
      ])
    )
  })

  it('拒绝负数待同步提交计数', () => {
    expect(() =>
      createUpstreamIntegrationState({
        ...integration,
        pendingUpstreamCommitCountAtRecord: -1
      })
    ).toThrow('pendingUpstreamCommitCountAtRecord 必须是非负整数')
  })
})

describe('上游同步命令参数', () => {
  it('要求使用完整 SHA 冻结审计目标', () => {
    expect(
      parseAuditArguments([
        '--sync-ready',
        `--expected-upstream-sha=${integration.upstreamTargetSha}`
      ])
    ).toMatchObject({
      syncReady: true,
      expectedUpstreamSha: integration.upstreamTargetSha
    })
    expect(() => parseAuditArguments(['--expected-upstream-sha=abc1234'])).toThrow(
      '40 位小写 Git SHA'
    )
  })

  it('只接受验证通过的同步记录', () => {
    const baseArguments = [
      `--pre-sync-head=${integration.preSyncHead}`,
      `--upstream-sha=${integration.upstreamTargetSha}`,
      `--integration-commit=${integration.integrationCommit}`,
      '--strategy=merge'
    ]

    expect(parseRecordArguments([...baseArguments, '--verification-status=passed'])).toMatchObject({
      preSyncHead: integration.preSyncHead,
      upstreamTargetSha: integration.upstreamTargetSha,
      integrationCommit: integration.integrationCommit,
      strategy: 'merge'
    })
    expect(() => parseRecordArguments([...baseArguments, '--verification-status=pending'])).toThrow(
      '只有验证全部通过后'
    )
  })

  it('在真实 Merge 图中写入最后成功集成状态', () => {
    const repo = mkdtempSync(join(tmpdir(), 'sbbgt-upstream-state-'))
    try {
      git(repo, ['init'])
      git(repo, ['config', 'user.name', 'Test User'])
      git(repo, ['config', 'user.email', 'test@example.com'])
      git(repo, ['symbolic-ref', 'HEAD', 'refs/heads/main'])
      writeFileSync(join(repo, 'base.txt'), 'base\n')
      git(repo, ['add', 'base.txt'])
      git(repo, ['commit', '-m', 'base'])
      const base = git(repo, ['rev-parse', 'HEAD'])

      writeFileSync(join(repo, 'product.txt'), 'product\n')
      git(repo, ['add', 'product.txt'])
      git(repo, ['commit', '-m', 'product'])
      const preSyncHead = git(repo, ['rev-parse', 'HEAD'])

      git(repo, ['checkout', '-b', 'upstream-main', base])
      writeFileSync(join(repo, 'upstream.txt'), 'upstream\n')
      git(repo, ['add', 'upstream.txt'])
      git(repo, ['commit', '-m', 'upstream'])
      const upstreamTargetSha = git(repo, ['rev-parse', 'HEAD'])
      git(repo, ['update-ref', 'refs/remotes/upstream/main', upstreamTargetSha])

      git(repo, ['checkout', 'main'])
      git(repo, ['merge', '--no-ff', 'upstream-main', '-m', 'sync upstream'])
      const integrationCommit = git(repo, ['rev-parse', 'HEAD'])
      git(repo, ['remote', 'add', 'upstream', 'https://github.com/stablyai/orca.git'])
      mkdirSync(resolve(repo, 'skills/sync-orca-upstream/references'), { recursive: true })

      const result = recordUpstreamIntegration(
        {
          preSyncHead,
          upstreamTargetSha,
          integrationCommit,
          strategy: 'merge'
        },
        repo
      )
      const state = parseUpstreamIntegrationState(readFileSync(result.statePath, 'utf8'))

      expect(state.lastSuccessfulIntegration).toMatchObject({
        branch: 'main',
        preSyncHead,
        upstreamTargetSha,
        mergeBase: base,
        integrationCommit,
        postSyncFetchedSha: upstreamTargetSha,
        pendingUpstreamCommitCountAtRecord: 0
      })

      expect(auditRepository({}, repo).integrationState).toMatchObject({
        valid: true,
        errors: []
      })

      state.lastSuccessfulIntegration.pendingUpstreamCommitCountAtRecord = 1
      writeFileSync(result.statePath, `${JSON.stringify(state, null, 2)}\n`)
      expect(auditRepository({}, repo).integrationState.errors).toContain(
        '记录的同步后待集成提交数与 Git 提交图不一致: 0'
      )
    } finally {
      rmSync(repo, { recursive: true, force: true })
    }
  })
})

describe('上游同步 Skill 门禁', () => {
  it('要求冻结、记录和复核最后成功集成节点', () => {
    const skill = readFileSync(skillPath, 'utf8')

    expect(skill).toContain('upstream-integration-state.json')
    expect(skill).toContain('--expected-upstream-sha=<target-sha>')
    expect(skill).toContain('record-upstream-integration.mjs')
    expect(skill).toContain('--verify-integration-state')
  })
})
