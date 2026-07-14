#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const EXPECTED_UPSTREAM_URL = 'https://github.com/stablyai/orca.git'
const args = new Set(process.argv.slice(2))
const supportedArgs = new Set(['--help', '--json', '--sync-ready'])
const unknownArgs = [...args].filter((arg) => !supportedArgs.has(arg))

if (unknownArgs.length > 0) {
  console.error('不支持的参数: ' + unknownArgs.join(', '))
  process.exit(1)
}

if (args.has('--help')) {
  console.log([
    '用法: node audit-upstream.mjs [--json] [--sync-ready]',
    '',
    '默认只读审计当前仓库，不执行 fetch、merge、rebase 或任何文件修改。',
    '--json        输出机器可读 JSON。',
    '--sync-ready  前置条件未满足时以状态码 2 退出。',
  ].join('\n'))
  process.exit(0)
}

function runGit(gitArgs, cwd, allowFailure = false) {
  const result = spawnSync('git', gitArgs, {
    cwd,
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (result.error) {
    throw new Error('无法执行 git: ' + result.error.message)
  }

  const commandResult = {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || '').trimEnd(),
    stderr: (result.stderr || '').trimEnd(),
  }

  if (!commandResult.ok && !allowFailure) {
    const detail = commandResult.stderr || commandResult.stdout || '未知错误'
    throw new Error('git ' + gitArgs.join(' ') + ' 失败: ' + detail)
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

function isAncestor(ancestor, descendant, repoRoot) {
  const result = runGit(['merge-base', '--is-ancestor', ancestor, descendant], repoRoot, true)

  if (result.status === 0) return true
  if (result.status === 1) return false
  return null
}

function readComparison(head, upstreamRef, upstreamSha, repoRoot) {
  const countResult = runGit(
    ['rev-list', '--left-right', '--count', head + '...' + upstreamRef],
    repoRoot,
  )
  const [aheadText, behindText] = countResult.stdout.trim().split(/\s+/)
  const mergeBaseResult = runGit(['merge-base', head, upstreamRef], repoRoot, true)
  const headIsAncestor = isAncestor(head, upstreamRef, repoRoot)
  const upstreamIsAncestor = isAncestor(upstreamRef, head, repoRoot)
  const mergeBase = mergeBaseResult.ok ? mergeBaseResult.stdout.trim() : null

  let relationship = 'diverged'
  if (head === upstreamSha) relationship = 'identical'
  else if (headIsAncestor) relationship = 'behind-only'
  else if (upstreamIsAncestor) relationship = 'ahead-only'
  else if (!mergeBase) relationship = 'unrelated'

  return {
    ahead: Number(aheadText),
    behind: Number(behindText),
    mergeBase,
    relationship,
    headIsAncestorOfUpstream: headIsAncestor,
    upstreamIsAncestorOfHead: upstreamIsAncestor,
  }
}

function auditRepository() {
  const rootResult = runGit(['rev-parse', '--show-toplevel'], process.cwd())
  const repoRoot = rootResult.stdout.trim()
  const head = runGit(['rev-parse', 'HEAD'], repoRoot).stdout.trim()
  const branchResult = runGit(['symbolic-ref', '--quiet', '--short', 'HEAD'], repoRoot, true)
  const branch = branchResult.ok ? branchResult.stdout.trim() : null
  const commitFields = runGit(
    ['show', '-s', '--format=%P%x00%T%x00%cI%x00%s', 'HEAD'],
    repoRoot,
  ).stdout.split('\0')
  const worktreeText = runGit(
    ['status', '--porcelain=v1', '--untracked-files=all'],
    repoRoot,
  ).stdout
  const worktreeChanges = worktreeText ? worktreeText.split('\n') : []
  const originUrl = readRemoteUrl('origin', repoRoot)
  const upstreamUrl = readRemoteUrl('upstream', repoRoot)
  const originMain = readRef('refs/remotes/origin/main', repoRoot)
  const upstreamMain = readRef('refs/remotes/upstream/main', repoRoot)
  const blockers = []

  if (!branch) blockers.push('当前处于 Detached HEAD')
  if (upstreamUrl !== EXPECTED_UPSTREAM_URL) {
    blockers.push('upstream URL 缺失或不是固定官方地址')
  }
  if (!upstreamMain) blockers.push('本地尚无 refs/remotes/upstream/main，请先成功 Fetch')
  if (worktreeChanges.length > 0) blockers.push('工作区不干净，包括已跟踪或未跟踪改动')

  return {
    repositoryRoot: repoRoot,
    branch,
    head,
    headCommit: {
      parents: commitFields[0] ? commitFields[0].split(' ') : [],
      tree: commitFields[1] || null,
      committedAt: commitFields[2] || null,
      subject: commitFields.slice(3).join('\0') || null,
    },
    remotes: {
      origin: originUrl,
      upstream: upstreamUrl,
      expectedUpstream: EXPECTED_UPSTREAM_URL,
    },
    refs: {
      originMain,
      upstreamMain,
    },
    worktree: {
      clean: worktreeChanges.length === 0,
      changes: worktreeChanges,
    },
    comparison: upstreamMain
      ? readComparison(head, 'refs/remotes/upstream/main', upstreamMain, repoRoot)
      : null,
    syncReady: blockers.length === 0,
    blockers,
  }
}

function formatHumanReport(report) {
  const lines = [
    'Orca 上游同步审计',
    '仓库: ' + report.repositoryRoot,
    '分支: ' + (report.branch || '(Detached HEAD)'),
    'HEAD: ' + report.head,
    '提交: ' + report.headCommit.subject,
    'origin: ' + (report.remotes.origin || '(未配置)'),
    'upstream: ' + (report.remotes.upstream || '(未配置)'),
    'origin/main: ' + (report.refs.originMain || '(本地引用不存在)'),
    'upstream/main: ' + (report.refs.upstreamMain || '(尚未 Fetch 到本地)'),
    '工作区: ' + (report.worktree.clean ? '干净' : '存在改动'),
  ]

  if (!report.worktree.clean) {
    lines.push('工作区明细:')
    for (const change of report.worktree.changes) lines.push('  ' + change)
  }

  if (report.comparison) {
    lines.push(
      '关系: ' + report.comparison.relationship,
      'Ahead/Behind: ' + report.comparison.ahead + '/' + report.comparison.behind,
      'Merge Base: ' + (report.comparison.mergeBase || '(无共同祖先)'),
    )
  } else {
    lines.push('差异: 本地 upstream/main 不存在，不能计算 Ahead/Behind 或 Merge Base')
  }

  lines.push('同步前置检查: ' + (report.syncReady ? '通过' : '未通过'))
  for (const blocker of report.blockers) lines.push('  - ' + blocker)
  lines.push('提示: API 观测节点请查 references/repository-baseline.md，不能替代本地 Fetch 引用。')

  return lines.join('\n')
}

try {
  const report = auditRepository()

  if (args.has('--json')) console.log(JSON.stringify(report, null, 2))
  else console.log(formatHumanReport(report))

  if (args.has('--sync-ready') && !report.syncReady) process.exitCode = 2
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
