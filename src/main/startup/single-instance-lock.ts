import type { App } from 'electron'
import { writeStartupDiagnosticLine, type StartupDiagnosticSink } from './startup-diagnostics'

export const SINGLE_INSTANCE_LOCK_FAILURE_MESSAGE =
  '[single-instance] 当前 userData 配置已有赛博包工头实例运行；请求显示现有窗口后退出本次启动。如果没有运行中的进程，可能是 Electron/macOS 单实例锁异常。'
export const SINGLE_INSTANCE_LOCK_BYPASS_ENV = 'SBBGT_BYPASS_SINGLE_INSTANCE_LOCK'
export const LEGACY_SINGLE_INSTANCE_LOCK_BYPASS_ENV = 'ORCA_BYPASS_SINGLE_INSTANCE_LOCK'
export const SINGLE_INSTANCE_LOCK_E2E_ENFORCE_ENV = 'SBBGT_E2E_ENFORCE_SINGLE_INSTANCE_LOCK'
export const LEGACY_SINGLE_INSTANCE_LOCK_E2E_ENFORCE_ENV = 'ORCA_E2E_ENFORCE_SINGLE_INSTANCE_LOCK'
export const SINGLE_INSTANCE_LOCK_BYPASS_MESSAGE =
  '[single-instance] 已启用 SBBGT_BYPASS_SINGLE_INSTANCE_LOCK=1，诊断流程将绕过 macOS 单实例锁。请勿与使用同一配置的其他赛博包工头实例同时运行。'

/**
 * 单实例锁保护 userData 内的运行时发现文件，避免多个 Electron 主进程相互覆盖元数据。
 * 必须在配置开发 userData 后调用，确保开发版与打包版使用独立锁命名空间。
 */
export function acquireSingleInstanceLock(app: App, onSecondInstance: () => void): boolean {
  if (!app.requestSingleInstanceLock()) {
    return false
  }
  app.on('second-instance', onSecondInstance)
  return true
}

export function shouldBypassSingleInstanceLock(options: {
  env?: NodeJS.ProcessEnv
  isDev: boolean
  isServeMode: boolean
  platform?: NodeJS.Platform
}): boolean {
  const env = options.env ?? process.env
  const platform = options.platform ?? process.platform
  return (
    platform === 'darwin' &&
    !options.isDev &&
    !options.isServeMode &&
    (env[SINGLE_INSTANCE_LOCK_BYPASS_ENV] === '1' ||
      env[LEGACY_SINGLE_INSTANCE_LOCK_BYPASS_ENV] === '1')
  )
}

export function shouldSkipSingleInstanceLock(options: {
  env?: NodeJS.ProcessEnv
  isDev: boolean
  isServeMode: boolean
}): boolean {
  const env = options.env ?? process.env
  const enforcesSingleInstance =
    env[SINGLE_INSTANCE_LOCK_E2E_ENFORCE_ENV] === '1' ||
    env[LEGACY_SINGLE_INSTANCE_LOCK_E2E_ENFORCE_ENV] === '1'
  return options.isDev && !options.isServeMode && !enforcesSingleInstance
}

export function logSingleInstanceLockFailure(write?: StartupDiagnosticSink): void {
  writeStartupDiagnosticLine(SINGLE_INSTANCE_LOCK_FAILURE_MESSAGE, write)
}

export function logSingleInstanceLockBypass(write?: StartupDiagnosticSink): void {
  writeStartupDiagnosticLine(SINGLE_INSTANCE_LOCK_BYPASS_MESSAGE, write)
}
