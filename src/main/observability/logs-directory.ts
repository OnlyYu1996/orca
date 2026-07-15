// 应用日志目录及其文件的单一来源；Electron 不可用时按平台回退到同名用户目录。

import { app } from 'electron'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
import { PRODUCT_DISPLAY_NAME } from '../../shared/product-identity'

function getUserDataDir(): string {
  try {
    return app.getPath('userData')
  } catch {
    // 测试中 Electron 可能尚未初始化，按系统约定生成与正式应用一致的回退目录。
    const home = homedir()
    if (platform() === 'darwin') {
      return join(home, 'Library', 'Application Support', PRODUCT_DISPLAY_NAME)
    }
    if (platform() === 'win32') {
      return join(process.env.APPDATA ?? home, PRODUCT_DISPLAY_NAME)
    }
    return join(home, '.config', PRODUCT_DISPLAY_NAME)
  }
}

export function getLogsDirectory(): string {
  return join(getUserDataDir(), 'logs')
}

/** NDJSON trace file written by the main-process error-tracking sink. */
export function getTraceFilePath(): string {
  return join(getLogsDirectory(), 'main.trace.ndjson')
}

/** NDJSON lifecycle log written by the detached daemon process. Shared here so
 *  the daemon fork (which passes it as `--log-file`) and the bundle collector
 *  (which reads it) agree on one path. */
export function getDaemonLogFilePath(): string {
  return join(getLogsDirectory(), 'daemon.log')
}
