import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

export function resolveMacOSComputerUseAppPath(): string | null {
  const override =
    process.env.SBBGT_COMPUTER_MACOS_HELPER_APP_PATH ??
    process.env.ORCA_COMPUTER_MACOS_HELPER_APP_PATH
  if (override && existsSync(override)) {
    return override
  }

  const packaged = [join(process.resourcesPath ?? '', '赛博包工头电脑控制.app')]
  const dev = [
    join(process.cwd(), 'native/computer-use-macos/.build/release/赛博包工头电脑控制.app'),
    resolve(__dirname, '../../native/computer-use-macos/.build/release/赛博包工头电脑控制.app')
  ]
  const candidates = process.resourcesPath ? [...packaged, ...dev] : dev

  return candidates.find((candidate) => candidate && existsSync(candidate)) ?? null
}

export function resolveMacOSComputerUseExecutablePath(): string | null {
  const appPath = resolveMacOSComputerUseAppPath()
  if (!appPath) {
    return null
  }
  const executablePath = join(appPath, 'Contents', 'MacOS', 'orca-computer-use-macos')
  return existsSync(executablePath) ? executablePath : null
}

export function resolveMacOSNativeProviderPath(): string | null {
  const override =
    process.env.SBBGT_COMPUTER_MACOS_PROVIDER_PATH ?? process.env.ORCA_COMPUTER_MACOS_PROVIDER_PATH
  if (override && existsSync(override)) {
    return override
  }

  const packaged = [join(process.resourcesPath ?? '', 'computer-use-macos/orca-computer-use-macos')]
  const dev = [
    join(process.cwd(), 'native/computer-use-macos/.build/debug/orca-computer-use-macos'),
    join(process.cwd(), 'native/computer-use-macos/.build/release/orca-computer-use-macos'),
    resolve(__dirname, '../../native/computer-use-macos/.build/debug/orca-computer-use-macos')
  ]
  const candidates = process.resourcesPath ? [...packaged, ...dev] : dev

  return candidates.find((candidate) => candidate && existsSync(candidate)) ?? null
}
