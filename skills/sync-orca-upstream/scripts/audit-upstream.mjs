#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  EXPECTED_UPSTREAM_URL,
  INTEGRATION_STATE_RELATIVE_PATH,
  isFullGitSha,
  readUpstreamIntegrationState
} from './upstream-integration-state.mjs'

const BOOLEAN_OPTIONS = new Set(['--help', '--json', '--sync-ready', '--verify-integration-state'])

export function parseAuditArguments(argv) {
  const options = {
    help: false,
    json: false,
    syncReady: false,
    verifyIntegrationState: false,
    expectedUpstreamSha: null
  }

  for (const argument of argv) {
    if (BOOLEAN_OPTIONS.has(argument)) {
      const key = {
        '--help': 'help',
        '--json': 'json',
        '--sync-ready': 'syncReady',
        '--verify-integration-state': 'verifyIntegrationState'
      }[argument]
      options[key] = true
      continue
    }
    if (argument.startsWith('--expected-upstream-sha=')) {
      if (options.expectedUpstreamSha) {
        throw new Error('参数重复: --expected-upstream-sha')
      }
      options.expectedUpstreamSha = argument.slice('--expected-upstream-sha='.length)
      if (!isFullGitSha(options.expectedUpstreamSha)) {
        throw new Error('--expected-upstream-sha 必须是 40 位小写 Git SHA')
      }
      continue
    }
    throw new Error(`不支持的参数: ${argument}`)
  }
  return options
}

function runGit(gitArgs, cwd, allowFailure = false) {
  const result = spawnSync('git', gitArgs, {
    cwd,
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  if (result.error) {
    throw new Error(`无法执行 git: ${result.error.message}`)
  }

  const commandResult = {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || '').trimEnd(),
    stderr: (result.stderr || '').trimEnd()
  }
  if (!commandResult.ok && !allowFailure) {
    const detail = commandResult.stderr || commandResult.stdout || '未知错误'
    throw new Error(`git ${gitArgs.join(' ')} 失败: ${detail}`)
  }
  return commandResult
}

function readRemoteUrl(name, repoRoot) {
  const result = runGit(['remote', 'get-url', name], repoRoot, true)
  return result.ok ? result.stdout.trim() : null
}

function readRef(refName, repoRoot) {
  const result = runGit(['show-ref', '--verify', '--hash', refName], repoRoot, true)
  return result.ok ? result.stdout.trim() : null
}

function commitExists(sha, repoRoot) {
  return runGit(['rev-parse', '--verify', `${sha}^{commit}`], repoRoot, true).ok
}

function isAncestor(ancestor, descendant, repoRoot) {
  const result = runGit(['merge-base', '--is-ancestor', ancestor, descendant], repoRoot, true)
  if (result.status === 0) {
    return true
  }
  if (result.status === 1) {
    return false
  }
  return null
}

function readComparison(head, upstreamRef, upstreamSha, repoRoot) {
  const countResult = runGit(
    ['rev-list', '--left-right', '--count', `${head}...${upstreamRef}`],
    repoRoot
  )
  const [aheadText, behindText] = countResult.stdout.trim().split(/\s+/)
  const mergeBaseResult = runGit(['merge-base', head, upstreamRef], repoRoot, true)
  const headIsAncestor = isAncestor(head, upstreamRef, repoRoot)
  const upstreamIsAncestor = isAncestor(upstreamRef, head, repoRoot)
  const mergeBase = mergeBaseResult.ok ? mergeBaseResult.stdout.trim() : null

  let relationship = 'diverged'
  if (head === upstreamSha) {
    relationship = 'identical'
  } else if (headIsAncestor) {
    relationship = 'behind-only'
  } else if (upstreamIsAncestor) {
    relationship = 'ahead-only'
  } else if (!mergeBase) {
    relationship = 'unrelated'
  }

  return {
    ahead: Number(aheadText),
    behind: Number(behindText),
    mergeBase,
    relationship,
    headIsAncestorOfUpstream: headIsAncestor,
    upstreamIsAncestorOfHead: upstreamIsAncestor
  }
}

function inspectIntegrationState(repoRoot, head, upstreamMain) {
  const statePath = join(repoRoot, INTEGRATION_STATE_RELATIVE_PATH)
  const result = {
    path: statePath,
    exists: existsSync(statePath),
    valid: false,
    errors: [],
    lastSuccessfulIntegration: null,
    fetchedDelta: null
  }
  if (!result.exists) {
    result.errors.push('缺少机器可读的上游集成状态文件')
    return result
  }

  let state
  try {
    state = readUpstreamIntegrationState(statePath)
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
    return result
  }

  const integration = state.lastSuccessfulIntegration
  result.lastSuccessfulIntegration = integration
  for (const [label, sha] of [
    ['同步前 HEAD', integration.preSyncHead],
    ['上游目标 SHA', integration.upstreamTargetSha],
    ['Merge Base', integration.mergeBase],
    ['二开同步节点', integration.integrationCommit],
    ['同步后 Fetch 节点', integration.postSyncFetchedSha]
  ]) {
    if (!commitExists(sha, repoRoot)) {
      result.errors.push(`${label} 对应的 Git 提交对象不存在: ${sha}`)
    }
  }
  if (result.errors.length > 0) {
    return result
  }

  const actualMergeBase = runGit(
    ['merge-base', integration.preSyncHead, integration.upstreamTargetSha],
    repoRoot
  ).stdout.trim()
  if (actualMergeBase !== integration.mergeBase) {
    result.errors.push(`记录的 Merge Base 与 Git 提交图不一致: ${actualMergeBase}`)
  }
  if (!isAncestor(integration.upstreamTargetSha, integration.integrationCommit, repoRoot)) {
    result.errors.push('记录的上游目标 SHA 不是二开同步节点的祖先')
  }
  if (!isAncestor(integration.integrationCommit, head, repoRoot)) {
    result.errors.push('记录的二开同步节点不是当前 HEAD 的祖先')
  }
  if (!isAncestor(integration.upstreamTargetSha, integration.postSyncFetchedSha, repoRoot)) {
    result.errors.push('记录的同步后 Fetch 节点不包含上游目标 SHA')
  } else {
    const actualPendingCount = Number(
      runGit(
        [
          'rev-list',
          '--count',
          `${integration.upstreamTargetSha}..${integration.postSyncFetchedSha}`
        ],
        repoRoot
      ).stdout.trim()
    )
    if (actualPendingCount !== integration.pendingUpstreamCommitCountAtRecord) {
      result.errors.push(`记录的同步后待集成提交数与 Git 提交图不一致: ${actualPendingCount}`)
    }
  }
  if (integration.strategy === 'merge') {
    const parents = runGit(
      ['show', '-s', '--format=%P', integration.integrationCommit],
      repoRoot
    ).stdout.split(' ')
    if (
      !parents.includes(integration.preSyncHead) ||
      !parents.includes(integration.upstreamTargetSha)
    ) {
      result.errors.push('记录的 Merge 节点没有直接包含同步前 HEAD 和上游目标 SHA')
    }
  }
  if (
    integration.strategy === 'fast-forward' &&
    integration.integrationCommit !== integration.upstreamTargetSha
  ) {
    result.errors.push('记录的 Fast-forward 节点不等于上游目标 SHA')
  }
  if (
    integration.strategy === 'fast-forward' &&
    !isAncestor(integration.preSyncHead, integration.upstreamTargetSha, repoRoot)
  ) {
    result.errors.push('记录的 Fast-forward 同步前 HEAD 不是上游目标 SHA 的祖先')
  }

  if (upstreamMain) {
    result.fetchedDelta = readComparison(
      integration.upstreamTargetSha,
      'refs/remotes/upstream/main',
      upstreamMain,
      repoRoot
    )
  }
  result.valid = result.errors.length === 0
  return result
}

export function auditRepository(options = {}, cwd = process.cwd()) {
  const repoRoot = runGit(['rev-parse', '--show-toplevel'], cwd).stdout.trim()
  const head = runGit(['rev-parse', 'HEAD'], repoRoot).stdout.trim()
  const branchResult = runGit(['symbolic-ref', '--quiet', '--short', 'HEAD'], repoRoot, true)
  const branch = branchResult.ok ? branchResult.stdout.trim() : null
  const commitFields = runGit(
    ['show', '-s', '--format=%P%x00%T%x00%cI%x00%s', 'HEAD'],
    repoRoot
  ).stdout.split('\0')
  const worktreeText = runGit(
    ['status', '--porcelain=v1', '--untracked-files=all'],
    repoRoot
  ).stdout
  const worktreeChanges = worktreeText ? worktreeText.split('\n') : []
  const originUrl = readRemoteUrl('origin', repoRoot)
  const upstreamUrl = readRemoteUrl('upstream', repoRoot)
  const originMain = readRef('refs/remotes/origin/main', repoRoot)
  const upstreamMain = readRef('refs/remotes/upstream/main', repoRoot)
  const integrationState = inspectIntegrationState(repoRoot, head, upstreamMain)
  const blockers = []

  if (!branch) {
    blockers.push('当前处于 Detached HEAD')
  }
  if (upstreamUrl !== EXPECTED_UPSTREAM_URL) {
    blockers.push('upstream URL 缺失或不是固定官方地址')
  }
  if (!upstreamMain) {
    blockers.push('本地尚无 refs/remotes/upstream/main，请先成功 Fetch')
  }
  if (worktreeChanges.length > 0) {
    blockers.push('工作区不干净，包括已跟踪或未跟踪改动')
  }
  if (!integrationState.valid) {
    blockers.push('机器可读的上游集成状态与 Git 提交图不一致')
  }
  if (!options.expectedUpstreamSha) {
    blockers.push('未提供冻结的本次上游目标 SHA')
  } else if (options.expectedUpstreamSha !== upstreamMain) {
    blockers.push('冻结的上游目标 SHA 与当前本地 upstream/main 不一致')
  }

  return {
    repositoryRoot: repoRoot,
    branch,
    head,
    headCommit: {
      parents: commitFields[0] ? commitFields[0].split(' ') : [],
      tree: commitFields[1] || null,
      committedAt: commitFields[2] || null,
      subject: commitFields.slice(3).join('\0') || null
    },
    remotes: {
      origin: originUrl,
      upstream: upstreamUrl,
      expectedUpstream: EXPECTED_UPSTREAM_URL
    },
    refs: {
      originMain,
      upstreamMain
    },
    frozenUpstreamTarget: options.expectedUpstreamSha,
    worktree: {
      clean: worktreeChanges.length === 0,
      changes: worktreeChanges
    },
    comparison: upstreamMain
      ? readComparison(head, 'refs/remotes/upstream/main', upstreamMain, repoRoot)
      : null,
    integrationState,
    syncReady: blockers.length === 0,
    blockers
  }
}

function formatHumanReport(report) {
  const lines = [
    '赛博包工头上游同步审计',
    `仓库: ${report.repositoryRoot}`,
    `分支: ${report.branch || '(Detached HEAD)'}`,
    `产品 HEAD: ${report.head}`,
    `提交: ${report.headCommit.subject}`,
    `origin: ${report.remotes.origin || '(未配置)'}`,
    `upstream: ${report.remotes.upstream || '(未配置)'}`,
    `origin/main: ${report.refs.originMain || '(本地引用不存在)'}`,
    `已获取 upstream/main: ${report.refs.upstreamMain || '(尚未 Fetch 到本地)'}`,
    `冻结目标: ${report.frozenUpstreamTarget || '(未提供)'}`,
    `工作区: ${report.worktree.clean ? '干净' : '存在改动'}`
  ]

  if (!report.worktree.clean) {
    lines.push('工作区明细:')
    for (const change of report.worktree.changes) {
      lines.push(`  ${change}`)
    }
  }
  if (report.comparison) {
    lines.push(
      `产品分支关系: ${report.comparison.relationship}`,
      `产品 Ahead/Behind: ${report.comparison.ahead}/${report.comparison.behind}`,
      `产品 Merge Base: ${report.comparison.mergeBase || '(无共同祖先)'}`
    )
  }

  const integration = report.integrationState.lastSuccessfulIntegration
  lines.push(`集成状态校验: ${report.integrationState.valid ? '通过' : '未通过'}`)
  if (integration) {
    lines.push(
      `最后成功集成上游: ${integration.upstreamTargetSha}`,
      `二开同步节点: ${integration.integrationCommit}`
    )
  }
  if (report.integrationState.fetchedDelta) {
    lines.push(
      `已获取上游相对最后集成节点: ${report.integrationState.fetchedDelta.relationship}`,
      `待集成提交数: ${report.integrationState.fetchedDelta.behind}`
    )
  }
  for (const error of report.integrationState.errors) {
    lines.push(`  - ${error}`)
  }

  lines.push(`同步前置检查: ${report.syncReady ? '通过' : '未通过'}`)
  for (const blocker of report.blockers) {
    lines.push(`  - ${blocker}`)
  }
  lines.push('提示: 已获取 upstream/main 仍需由执行同步前的成功 Fetch 保证新鲜度。')
  return lines.join('\n')
}

function printHelp() {
  console.log(
    [
      '用法: node audit-upstream.mjs [选项]',
      '',
      '默认只读审计当前仓库，不执行 fetch、merge、rebase 或任何文件修改。',
      '--json                              输出机器可读 JSON。',
      '--sync-ready                        前置条件未满足时以状态码 2 退出。',
      '--expected-upstream-sha=<sha>        冻结并核对本次同步目标。',
      '--verify-integration-state          机器状态与 Git 图不一致时以状态码 2 退出。'
    ].join('\n')
  )
}

async function main() {
  const options = parseAuditArguments(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const report = auditRepository(options)
  console.log(options.json ? JSON.stringify(report, null, 2) : formatHumanReport(report))

  if (options.verifyIntegrationState && !report.integrationState.valid) {
    process.exitCode = 2
  } else if (options.syncReady && !report.syncReady) {
    process.exitCode = 2
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
