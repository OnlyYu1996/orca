import type { FileReadResult, IFilesystemProvider } from './providers/types'
import { joinWorktreeRelativePath } from './runtime/runtime-relative-paths'
import {
  LEGACY_PRODUCT_IDENTITY,
  PRODUCT_PRIVATE_DIRECTORY,
  PRODUCT_PROJECT_CONFIG_FILE
} from '../shared/product-identity'
import { isENOENT } from './ipc/filesystem-auth'

export type PreferredProjectFileRead = {
  filePath: string
  result: FileReadResult
  source: 'current' | 'legacy'
  hasConflict: boolean
}

async function readIfPresent(
  fsProvider: Pick<IFilesystemProvider, 'readFile'>,
  filePath: string
): Promise<FileReadResult | null> {
  try {
    return await fsProvider.readFile(filePath)
  } catch (error) {
    if (isENOENT(error)) {
      return null
    }
    throw error
  }
}

async function readPreferredFile(
  fsProvider: Pick<IFilesystemProvider, 'readFile'>,
  currentPath: string,
  legacyPath: string
): Promise<PreferredProjectFileRead | null> {
  const [current, legacy] = await Promise.all([
    readIfPresent(fsProvider, currentPath),
    readIfPresent(fsProvider, legacyPath)
  ])
  if (current) {
    return {
      filePath: currentPath,
      result: current,
      source: 'current',
      hasConflict: legacy !== null
    }
  }
  return legacy
    ? { filePath: legacyPath, result: legacy, source: 'legacy', hasConflict: false }
    : null
}

export function readPreferredProjectConfiguration(
  fsProvider: Pick<IFilesystemProvider, 'readFile'>,
  repoPath: string
): Promise<PreferredProjectFileRead | null> {
  return readPreferredFile(
    fsProvider,
    joinWorktreeRelativePath(repoPath, PRODUCT_PROJECT_CONFIG_FILE),
    joinWorktreeRelativePath(repoPath, LEGACY_PRODUCT_IDENTITY.projectConfigFile)
  )
}

export function readPreferredProjectPrivateFile(
  fsProvider: Pick<IFilesystemProvider, 'readFile'>,
  repoPath: string,
  relativePath: string
): Promise<PreferredProjectFileRead | null> {
  return readPreferredFile(
    fsProvider,
    joinWorktreeRelativePath(repoPath, `${PRODUCT_PRIVATE_DIRECTORY}/${relativePath}`),
    joinWorktreeRelativePath(
      repoPath,
      `${LEGACY_PRODUCT_IDENTITY.privateDirectory}/${relativePath}`
    )
  )
}
