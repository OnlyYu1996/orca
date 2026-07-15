#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { accessSync, constants, existsSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'

const scriptPath = realpathSync(import.meta.filename)
const scriptDir = path.dirname(scriptPath)
const repoRoot = path.resolve(scriptDir, '..', '..')
const cliEntry =
  process.env.SBBGT_DEV_CLI_ENTRY_PATH ??
  process.env.ORCA_DEV_CLI_ENTRY_PATH ??
  path.join(repoRoot, 'out', 'cli', 'index.js')

if (!existsSync(cliEntry)) {
  console.error("sbbgt-dev：CLI 尚未构建，请先运行 'pnpm run build:cli'。")
  process.exit(1)
}

process.env.SBBGT_USER_DATA_PATH =
  process.env.SBBGT_DEV_USER_DATA_PATH ??
  process.env.ORCA_DEV_USER_DATA_PATH ??
  getDefaultDevUserDataPath()
process.env.ORCA_USER_DATA_PATH = process.env.SBBGT_USER_DATA_PATH

const electronExecutable = getElectronExecutable()
if (
  !process.env.SBBGT_APP_EXECUTABLE &&
  !process.env.ORCA_APP_EXECUTABLE &&
  isRunnableFile(electronExecutable)
) {
  process.env.SBBGT_APP_EXECUTABLE = electronExecutable
  process.env.SBBGT_APP_EXECUTABLE_NEEDS_APP_ROOT = '1'
}
process.env.ORCA_APP_EXECUTABLE ??= process.env.SBBGT_APP_EXECUTABLE
process.env.ORCA_APP_EXECUTABLE_NEEDS_APP_ROOT ??= process.env.SBBGT_APP_EXECUTABLE_NEEDS_APP_ROOT

const result = spawnSync(process.execPath, [cliEntry, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env
})

if (result.signal) {
  process.kill(process.pid, result.signal)
}
process.exit(result.status ?? (result.error ? 1 : 0))

function getDefaultDevUserDataPath() {
  if (process.platform === 'darwin') {
    return path.join(process.env.HOME ?? '', 'Library', 'Application Support', 'sbbgt-dev')
  }
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA ?? path.join(process.env.USERPROFILE ?? '', 'AppData', 'Roaming'),
      'sbbgt-dev'
    )
  }
  return path.join(
    process.env.XDG_CONFIG_HOME ?? path.join(process.env.HOME ?? '', '.config'),
    'sbbgt-dev'
  )
}

function getElectronExecutable() {
  if (process.platform === 'win32') {
    return path.join(repoRoot, 'node_modules', 'electron', 'dist', 'electron.exe')
  }
  return path.join(repoRoot, 'node_modules', '.bin', 'electron')
}

function isRunnableFile(candidate) {
  try {
    const stats = statSync(candidate)
    if (!stats.isFile()) {
      return false
    }
    if (process.platform === 'win32') {
      return true
    }
    accessSync(candidate, constants.X_OK)
    return true
  } catch {
    return false
  }
}
