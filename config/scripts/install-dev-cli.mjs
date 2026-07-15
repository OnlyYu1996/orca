#!/usr/bin/env node
// 将 sbbgt-dev 包装器链接到 /usr/local/bin，供本地开发构建使用。
// available globally after `pnpm run build:cli`.
import { existsSync, lstatSync, readlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const scriptDir = import.meta.dirname
const source = path.join(scriptDir, 'sbbgt-dev.mjs')

const commandPath =
  process.platform === 'darwin' || process.platform === 'linux' ? '/usr/local/bin/sbbgt-dev' : null

if (!commandPath) {
  console.log('[sbbgt-dev] 当前平台不支持全局符号链接，已跳过。')
  process.exit(0)
}

function isOwnedByUs(target) {
  try {
    if (!lstatSync(target).isSymbolicLink()) {
      return false
    }
    return readlinkSync(target) === source
  } catch {
    return false
  }
}

if (existsSync(commandPath)) {
  if (isOwnedByUs(commandPath)) {
    console.log(`[sbbgt-dev] ${commandPath} 已指向开发 CLI。`)
    process.exit(0)
  }
  console.error(`[sbbgt-dev] ${commandPath} 已存在且不属于本项目，不会覆盖。`)
  process.exit(0)
}

try {
  execFileSync('ln', ['-s', source, commandPath], { stdio: 'inherit' })
  console.log(`[sbbgt-dev] 已创建链接 ${commandPath} → ${source}`)
} catch {
  console.log(
    `[sbbgt-dev] 无法创建 ${commandPath}（权限不足），请运行：\n` +
      `  sudo ln -s ${source} ${commandPath}`
  )
}
