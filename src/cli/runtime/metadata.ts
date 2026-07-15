import { homedir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import {
  findTransport,
  getLegacyRuntimeMetadataPath,
  getRuntimeMetadataPath,
  type RuntimeMetadata
} from '../../shared/runtime-bootstrap'
import { RuntimeClientError } from './types'

export function readMetadata(userDataPath: string): RuntimeMetadata {
  const metadataPath = getRuntimeMetadataCandidatePaths(userDataPath).find((path) =>
    existsSync(path)
  )
  const preferredMetadataPath = metadataPath ?? getRuntimeMetadataPath(userDataPath)
  try {
    const metadata = JSON.parse(
      readFileSync(preferredMetadataPath, 'utf8')
    ) as RuntimeMetadata | null
    if (!metadata || !findTransport(metadata, 'unix', 'named-pipe') || !metadata.authToken) {
      throw new RuntimeClientError(
        'runtime_unavailable',
        `赛博包工头运行时元数据不完整：${preferredMetadataPath}`
      )
    }
    return metadata
  } catch (error) {
    if (error instanceof RuntimeClientError) {
      throw error
    }
    throw new RuntimeClientError(
      'runtime_unavailable',
      `无法读取赛博包工头运行时元数据：${preferredMetadataPath}。请先启动赛博包工头。`
    )
  }
}

export function tryReadMetadata(userDataPath: string): RuntimeMetadata | null {
  for (const metadataPath of getRuntimeMetadataCandidatePaths(userDataPath)) {
    try {
      return JSON.parse(readFileSync(metadataPath, 'utf8')) as RuntimeMetadata | null
    } catch {
      // 兼容窗口内继续尝试旧文件和旧数据目录。
    }
  }
  return null
}

function getRuntimeMetadataCandidatePaths(userDataPath: string): string[] {
  const paths = [getRuntimeMetadataPath(userDataPath), getLegacyRuntimeMetadataPath(userDataPath)]
  const directoryName = basename(userDataPath)
  if (directoryName === 'sbbgt' || directoryName === 'sbbgt-dev') {
    const parentPath = dirname(userDataPath)
    const legacyDirectoryNames = directoryName === 'sbbgt-dev' ? ['orca-dev'] : ['orca', 'Orca']
    for (const legacyDirectoryName of legacyDirectoryNames) {
      const legacyUserDataPath = join(parentPath, legacyDirectoryName)
      paths.push(
        getRuntimeMetadataPath(legacyUserDataPath),
        getLegacyRuntimeMetadataPath(legacyUserDataPath)
      )
    }
  }
  return [...new Set(paths)]
}

export function getDefaultUserDataPath(
  platform: NodeJS.Platform = process.platform,
  homeDir = homedir()
): string {
  // Why: in dev mode (and for parallel Orca instances), the Electron app writes
  // runtime metadata to a separate userData directory (e.g. `orca-dev`) to avoid
  // clobbering the production app's metadata. The CLI needs to find the same
  // metadata file, so this env var lets the CLI target a specific instance.
  const configuredUserDataPath = process.env.SBBGT_USER_DATA_PATH ?? process.env.ORCA_USER_DATA_PATH
  if (configuredUserDataPath) {
    return configuredUserDataPath
  }
  if (platform === 'darwin') {
    return join(homeDir, 'Library', 'Application Support', 'sbbgt')
  }
  if (platform === 'win32') {
    const appData = process.env.APPDATA
    if (!appData) {
      throw new RuntimeClientError(
        'runtime_unavailable',
        '未设置 APPDATA，无法解析赛博包工头运行时元数据目录。'
      )
    }
    return join(appData, 'sbbgt')
  }
  // Why: the CLI must find the same metadata file Electron writes in packaged
  // runs, so this mirrors Electron's default userData base instead of inventing
  // a CLI-specific config path.
  return join(process.env.XDG_CONFIG_HOME || join(homeDir, '.config'), 'sbbgt')
}
