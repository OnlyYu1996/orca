#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const allowlistPath = resolve(repoRoot, 'config/brand-boundary-allowlist.json')
const allowlist = JSON.parse(readFileSync(allowlistPath, 'utf8'))

const textExtensions = new Set([
  '.cjs',
  '.cmd',
  '.cs',
  '.desktop',
  '.js',
  '.json',
  '.jsonc',
  '.md',
  '.mjs',
  '.plist',
  '.ps1',
  '.py',
  '.rb',
  '.sh',
  '.swift',
  '.toml',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml'
])

const productRoots = [
  '.github/',
  'Casks/',
  'config/',
  'mobile/',
  'native/',
  'resources/',
  'src/',
  'tools/'
]
const ignoredPrefixes = ['docs/', 'skills/']
const ignoredFragments = ['.test.', '.spec.', '/Tests/', '/__tests__/', 'mobile/issue-']
const auditInfrastructureFiles = new Set([
  'config/brand-boundary-allowlist.json',
  'config/scripts/verify-brand-boundaries.mjs'
])
const localizationJsonFiles = new Set([
  'config/scripts/locale-ko-key-overrides.json',
  'src/renderer/src/i18n/locales/en.json',
  'src/renderer/src/i18n/locales/es.json',
  'src/renderer/src/i18n/locales/ja.json',
  'src/renderer/src/i18n/locales/ko.json',
  'src/renderer/src/i18n/locales/zh.json'
])
const releaseSurfaceFiles = new Set([
  'config/electron-builder.config.cjs',
  'mobile/app.json',
  'mobile/fastlane/Appfile',
  'mobile/fastlane/Fastfile',
  'package.json'
])
const desktopBrandSurfaceFiles = new Set([
  'src/main/app-icon.ts',
  'src/main/index.ts',
  'src/main/observability/logs-directory.ts',
  'src/main/runtime/windows-mobile-firewall.ts',
  'src/main/tray/system-tray.ts',
  'src/main/updater.ts',
  'src/main/window/createMainWindow.ts',
  'src/shared/app-icon.ts'
])

const fullTreePatterns = [
  { category: 'upstream-service-domain', regex: /(?:www\.|api\.)?onorca\.dev/i },
  { category: 'upstream-repository', regex: /stablyai\/orca/i },
  { category: 'legacy-bundle-id', regex: /com\.stably(?:ai)?\.orca/i }
]

const legacyAdditionPatterns = [
  { category: 'legacy-addition:url-scheme', regex: /\borca:\/\//i },
  { category: 'legacy-addition:project-config', regex: /\borca\.yaml\b/i },
  { category: 'legacy-addition:private-directory', regex: /(?:^|[^A-Za-z0-9])\.orca(?:\/|["'`])/ },
  {
    category: 'legacy-addition:environment-variable',
    regex: /(?:process\.env\.|env\.|\[\s*["'`]|["'`])ORCA_[A-Z0-9_]+/
  },
  { category: 'legacy-addition:bundle-id', regex: /com\.stably(?:ai)?\.orca/i },
  { category: 'legacy-addition:cli-command', regex: /["'`]orca(?:-dev|-ide)?(?:["'`]|\s)/i }
]

function runGit(args, allowFailure = false) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: false
  })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0 && !allowFailure) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} 执行失败`)
  }
  return result.status === 0 ? result.stdout : ''
}

function isProductTextFile(path) {
  if (auditInfrastructureFiles.has(path)) {
    return false
  }
  if (path === 'README.md' || path === 'package.json') {
    return true
  }
  if (!productRoots.some((prefix) => path.startsWith(prefix))) {
    return false
  }
  if (ignoredPrefixes.some((prefix) => path.startsWith(prefix))) {
    return false
  }
  if (ignoredFragments.some((fragment) => path.includes(fragment))) {
    return false
  }
  return textExtensions.has(extname(path))
}

function validateAllowlist() {
  if (allowlist.version !== 1 || typeof allowlist.migrationBaseline !== 'string') {
    throw new Error('品牌白名单缺少有效 version 或 migrationBaseline')
  }
  for (const [index, rule] of allowlist.rules.entries()) {
    if (
      typeof rule.category !== 'string' ||
      typeof rule.path !== 'string' ||
      typeof rule.contains !== 'string' ||
      typeof rule.reason !== 'string' ||
      rule.reason.trim().length < 8
    ) {
      throw new Error(`品牌白名单第 ${index + 1} 项缺少精确文件、匹配文本或保留原因`)
    }
  }
}

function isAllowed(violation) {
  return allowlist.rules.some(
    (rule) =>
      rule.category === violation.category &&
      rule.path === violation.path &&
      violation.line.includes(rule.contains)
  )
}

function scanFullTree(files) {
  const violations = []
  for (const path of files.filter(isProductTextFile)) {
    const lines = readFileSync(resolve(repoRoot, path), 'utf8').split(/\r?\n/)
    for (const [index, line] of lines.entries()) {
      for (const pattern of fullTreePatterns) {
        if (pattern.regex.test(line)) {
          violations.push({ category: pattern.category, path, lineNumber: index + 1, line })
        }
      }
    }
  }
  return violations
}

function sourceLineNumber(source, needle) {
  const index = source.indexOf(needle)
  return index < 0 ? 1 : source.slice(0, index).split(/\r?\n/).length
}

function collectJsonStringValues(value, values = []) {
  if (typeof value === 'string') {
    values.push(value)
    return values
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectJsonStringValues(entry, values))
    return values
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectJsonStringValues(entry, values))
  }
  return values
}

function scanLocalizationJsonValues(files) {
  const violations = []
  for (const path of files.filter((candidate) => localizationJsonFiles.has(candidate))) {
    const source = readFileSync(resolve(repoRoot, path), 'utf8')
    const values = collectJsonStringValues(JSON.parse(source))
    for (const value of values) {
      if (/\bOrca\b/.test(value)) {
        violations.push({
          category: 'user-visible-product-name',
          path,
          lineNumber: sourceLineNumber(source, JSON.stringify(value)),
          line: value
        })
      }
    }
  }
  return violations
}

function hasLegacyProductNameInStringLiteral(line) {
  let quote = null
  let literal = ''
  let escaped = false
  for (const character of line) {
    if (quote === null) {
      if (character === '"' || character === "'" || character === '`') {
        quote = character
        literal = ''
      }
      continue
    }
    if (escaped) {
      literal += character
      escaped = false
      continue
    }
    if (character === '\\') {
      escaped = true
      continue
    }
    if (character === quote) {
      if (/\bOrca\b/.test(literal)) {
        return true
      }
      quote = null
      literal = ''
      continue
    }
    literal += character
  }
  return quote !== null && /\bOrca\b/.test(literal)
}

function isUserVisibleLiteralSurface(path) {
  if (ignoredFragments.some((fragment) => path.includes(fragment))) {
    return false
  }
  if (path.startsWith('src/cli/specs/') || path === 'src/cli/cli-help-copy-zh.ts') {
    return false
  }
  if (path.startsWith('src/cli/') && extname(path) === '.ts') {
    return true
  }
  if (path.startsWith('native/computer-use-macos/Sources/') && extname(path) === '.swift') {
    return true
  }
  if (path.startsWith('.github/workflows/') || path.startsWith('Casks/')) {
    return true
  }
  return releaseSurfaceFiles.has(path) || desktopBrandSurfaceFiles.has(path)
}

function scanUserVisibleStringLiterals(files) {
  const violations = []
  for (const path of files.filter(isUserVisibleLiteralSurface)) {
    const lines = readFileSync(resolve(repoRoot, path), 'utf8').split(/\r?\n/)
    for (const [index, line] of lines.entries()) {
      const trimmed = line.trimStart()
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
        continue
      }
      if (hasLegacyProductNameInStringLiteral(line)) {
        violations.push({
          category: 'user-visible-product-name',
          path,
          lineNumber: index + 1,
          line
        })
      }
    }
  }
  return violations
}

function parseAddedLines(diffText) {
  const additions = []
  let currentPath = null
  let nextLine = 0
  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith('+++ b/')) {
      currentPath = line.slice(6)
      continue
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunk) {
      nextLine = Number(hunk[1])
      continue
    }
    if (!currentPath || line.startsWith('--- ')) {
      continue
    }
    if (line.startsWith('+')) {
      additions.push({ path: currentPath, lineNumber: nextLine, line: line.slice(1) })
      nextLine += 1
      continue
    }
    if (!line.startsWith('-') && !line.startsWith('\\')) {
      nextLine += 1
    }
  }
  return additions
}

function scanLegacyAdditions(untrackedFiles) {
  const baseline = allowlist.migrationBaseline
  const baselineExists = runGit(['rev-parse', '--verify', `${baseline}^{commit}`], true).trim()
  if (!baselineExists) {
    throw new Error(`品牌迁移基线提交不可解析：${baseline}`)
  }
  const diff = runGit(['diff', '--unified=0', '--no-color', baseline, '--'])
  const additions = parseAddedLines(diff)
  for (const path of untrackedFiles.filter(isProductTextFile)) {
    const lines = readFileSync(resolve(repoRoot, path), 'utf8').split(/\r?\n/)
    lines.forEach((line, index) => additions.push({ path, lineNumber: index + 1, line }))
  }

  const violations = []
  for (const addition of additions) {
    if (!isProductTextFile(addition.path)) {
      continue
    }
    for (const pattern of legacyAdditionPatterns) {
      if (pattern.regex.test(addition.line)) {
        violations.push({ ...addition, category: pattern.category })
      }
    }
  }
  return violations
}

function main() {
  validateAllowlist()
  const trackedFiles = runGit(['ls-files']).trim().split('\n').filter(Boolean)
  const untrackedFiles = runGit(['ls-files', '--others', '--exclude-standard'])
    .trim()
    .split('\n')
    .filter(Boolean)
  const files = [...new Set([...trackedFiles, ...untrackedFiles])]
  const candidates = [
    ...scanFullTree(files),
    ...scanLocalizationJsonValues(files),
    ...scanUserVisibleStringLiterals(files),
    ...scanLegacyAdditions(untrackedFiles)
  ]
  const violations = candidates.filter((candidate) => !isAllowed(candidate))

  if (violations.length > 0) {
    console.error(`品牌边界审计失败：发现 ${violations.length} 个未获准的旧品牌或上游绑定。`)
    for (const violation of violations) {
      console.error(
        `- [${violation.category}] ${violation.path}:${violation.lineNumber} ${violation.line.trim()}`
      )
    }
    console.error('合法兼容项必须在 config/brand-boundary-allowlist.json 中逐项记录原因。')
    process.exitCode = 1
    return
  }

  console.log(`品牌边界审计通过：检查 ${files.filter(isProductTextFile).length} 个产品文本文件。`)
}

main()
