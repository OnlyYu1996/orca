import { writeSync } from 'node:fs'

export const STARTUP_DIAGNOSTICS_ENV = 'SBBGT_STARTUP_DIAGNOSTICS'
export const LEGACY_STARTUP_DIAGNOSTICS_ENV = 'ORCA_STARTUP_DIAGNOSTICS'

export type StartupDiagnosticSink = (fd: number, text: string) => unknown

export function writeStartupDiagnosticLine(
  message: string,
  write: StartupDiagnosticSink = writeSync
): void {
  try {
    write(2, message.endsWith('\n') ? message : `${message}\n`)
  } catch {
    console.error(message)
  }
}

export function isStartupDiagnosticsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[STARTUP_DIAGNOSTICS_ENV] === '1' || env[LEGACY_STARTUP_DIAGNOSTICS_ENV] === '1'
}

export function logStartupDiagnostic(
  event: string,
  details: Record<string, unknown> = {},
  write?: StartupDiagnosticSink
): void {
  const detailText = Object.entries(details)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(' ')
  writeStartupDiagnosticLine(`[startup] ${event}${detailText ? ` ${detailText}` : ''}`, write)
}

// 启动基准必须使用进程内时间戳，避免 stderr 管道缓冲抖动；t 为进程启动后的毫秒数。
export function logStartupMilestone(event: string, details: Record<string, unknown> = {}): void {
  if (isStartupDiagnosticsEnabled()) {
    logStartupDiagnostic(event, { t: Math.round(performance.now()), ...details })
  }
}
