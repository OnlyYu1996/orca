#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  createUpstreamIntegrationState,
  EXPECTED_UPSTREAM_URL,
  INTEGRATION_STATE_RELATIVE_PATH,
  isFullGitSha
} from './upstream-integration-state.mjs'

const VALUE_OPTIONS = new Set([
  'pre-sync-head',
  'upstream-sha',
  'integration-commit',
  'strategy',
  'verification-status'
])

export function parseRecordArguments(argv) {
  if (argv.includes('--help')) {
    return { help: true }
  }

  const values = {}
  for (const argument of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(argument)
    if (!match || !VALUE_OPTIONS.has(match[1]) || match[2].length === 0) {
      throw new Error(`不支持的参数: ${argument}`)
    }
    if (values[match[1]]) {
      throw new Error(`参数重复: --${match[1]}`)
    }
    values[match[1]] = match[2]
  }

  for (const name of VALUE_OPTIONS) {
    if (!values[name]) {
      throw new Error(`缺少参数: --${name}=<value>`)
    }
  }
  for (const name of ['pre-sync-head', 'upstream-sha', 'integration-commit']) {
    if (!isFullGitSha(values[name])) {
      throw new Error(`--${name} 必须是 40 位小写 Git SHA`)
    }
  }
  if (!['merge', 'rebase', 'fast-forward'].includes(values.strategy)) {
    throw new Error('--strategy 必须为 merge、rebase 或 fast-forward')
  }
  if (values['verification-status'] !== 'passed') {
    throw new Error('只有验证全部通过后才能使用 --verification-status=passed 记录同步')
  }

  return {
    help: false,
    preSyncHead: values['pre-sync-head'],
    upstreamTargetSha: values['upstream-sha'],
    integrationCommit: values['integration-commit'],
    strategy: values.strategy
  }
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

function resolveCommit(sha, repoRoot) {
  const result = runGit(['rev-parse', '--verify', `${sha}^{commit}`], repoRoot, true)
  if (!result.ok) {
    throw new Error(`Git 提交对象不存在: ${sha}`)
  }
  return result.stdout.trim()
}

function requireAncestor(ancestor, descendant, repoRoot, message) {
  const result = runGit(['merge-base', '--is-ancestor', ancestor, descendant], repoRoot, true)
  if (result.status !== 0) {
    throw new Error(message)
  }
}

function verifyStrategy(options, repoRoot) {
  if (options.strategy === 'merge') {
    const parents = runGit(
      ['show', '-s', '--format=%P', options.integrationCommit],
      repoRoot
    ).stdout.split(' ')
    if (!parents.includes(options.preSyncHead) || !parents.includes(options.upstreamTargetSha)) {
      throw new Error('Merge 同步节点必须直接包含同步前 HEAD 和上游目标 SHA 两个父提交')
    }
  }
  if (
    options.strategy === 'fast-forward' &&
    options.integrationCommit !== options.upstreamTargetSha
  ) {
    throw new Error('Fast-forward 同步节点必须等于上游目标 SHA')
  }
  if (options.strategy === 'fast-forward') {
    requireAncestor(
      options.preSyncHead,
      options.upstreamTargetSha,
      repoRoot,
      'Fast-forward 同步前 HEAD 必须是上游目标 SHA 的祖先'
    )
  }
}

export function recordUpstreamIntegration(options, cwd = process.cwd()) {
  const repoRoot = runGit(['rev-parse', '--show-toplevel'], cwd).stdout.trim()
  const branchResult = runGit(['symbolic-ref', '--quiet', '--short', 'HEAD'], repoRoot, true)
  if (!branchResult.ok) {
    throw new Error('当前处于 Detached HEAD，不能记录同步状态')
  }
  if (runGit(['remote', 'get-url', 'upstream'], repoRoot).stdout.trim() !== EXPECTED_UPSTREAM_URL) {
    throw new Error('upstream URL 不是固定官方地址')
  }
  const worktree = runGit(['status', '--porcelain=v1', '--untracked-files=all'], repoRoot).stdout
  if (worktree) {
    throw new Error('记录同步状态前工作区必须干净，包括未跟踪文件')
  }

  const preSyncHead = resolveCommit(options.preSyncHead, repoRoot)
  const upstreamTargetSha = resolveCommit(options.upstreamTargetSha, repoRoot)
  const integrationCommit = resolveCommit(options.integrationCommit, repoRoot)
  const currentHead = runGit(['rev-parse', 'HEAD'], repoRoot).stdout.trim()
  const postSyncFetchedSha = runGit(
    ['show-ref', '--verify', '--hash', 'refs/remotes/upstream/main'],
    repoRoot
  ).stdout.trim()

  requireAncestor(
    upstreamTargetSha,
    integrationCommit,
    repoRoot,
    '上游目标 SHA 不是同步节点的祖先，不能标记为已集成'
  )
  requireAncestor(
    integrationCommit,
    currentHead,
    repoRoot,
    '同步节点不是当前 HEAD 的祖先，不能更新当前分支状态'
  )
  requireAncestor(
    upstreamTargetSha,
    postSyncFetchedSha,
    repoRoot,
    '同步后获取的 upstream/main 不包含本次目标 SHA，请先处理上游历史改写'
  )

  const mergeBase = runGit(['merge-base', preSyncHead, upstreamTargetSha], repoRoot).stdout.trim()
  const pendingUpstreamCommitCountAtRecord = Number(
    runGit(
      ['rev-list', '--count', `${upstreamTargetSha}..${postSyncFetchedSha}`],
      repoRoot
    ).stdout.trim()
  )
  const integratedAt = runGit(
    ['show', '-s', '--format=%cI', integrationCommit],
    repoRoot
  ).stdout.trim()

  verifyStrategy({ ...options, preSyncHead, upstreamTargetSha, integrationCommit }, repoRoot)

  const state = createUpstreamIntegrationState({
    branch: branchResult.stdout.trim(),
    preSyncHead,
    upstreamTargetSha,
    mergeBase,
    strategy: options.strategy,
    integrationCommit,
    integratedAt,
    postSyncFetchedSha,
    pendingUpstreamCommitCountAtRecord
  })
  const statePath = join(repoRoot, INTEGRATION_STATE_RELATIVE_PATH)
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')

  return { statePath, state }
}

function printHelp() {
  console.log(
    [
      '用法:',
      '  node record-upstream-integration.mjs \\',
      '    --pre-sync-head=<sha> --upstream-sha=<sha> \\',
      '    --integration-commit=<sha> --strategy=<merge|rebase|fast-forward> \\',
      '    --verification-status=passed',
      '',
      '只在冲突处理和约定验证全部通过后运行。脚本会复核 Git 提交图并更新机器状态。'
    ].join('\n')
  )
}

async function main() {
  const options = parseRecordArguments(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const result = recordUpstreamIntegration(options)
  console.log(`已记录上游目标: ${result.state.lastSuccessfulIntegration.upstreamTargetSha}`)
  console.log(`二开同步节点: ${result.state.lastSuccessfulIntegration.integrationCommit}`)
  console.log(`状态文件: ${result.statePath}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
