import { createHash, randomUUID } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'

const MIGRATION_MANIFEST_FILE = 'sbbgt-user-data-migration.json'
const TRANSIENT_ROOT_ENTRIES = new Set([
  'SingletonCookie',
  'SingletonLock',
  'SingletonSocket',
  'lockfile'
])

type SnapshotEntry = {
  path: string
  size: number
  sha256: string
}

type StorageSnapshot = {
  digest: string
  fileCount: number
  totalBytes: number
  entries: SnapshotEntry[]
  skippedPaths: string[]
}

export type UserDataMigrationResult =
  | { status: 'migrated'; sourcePath: string; targetPath: string; manifestPath: string }
  | { status: 'no-legacy-data' | 'target-not-empty'; targetPath: string }
  | { status: 'failed'; sourcePath: string; targetPath: string; stagingPath: string; error: string }

export type UserDataMigrationOptions = {
  appDataPath: string
  targetUserDataPath: string
  isDev: boolean
  appVersion: string
  now?: () => Date
}

function portableRelativePath(rootPath: string, filePath: string): string {
  return relative(rootPath, filePath).split(sep).join('/')
}

function isTransientEntry(rootPath: string, entryPath: string): boolean {
  const entryRelativePath = portableRelativePath(rootPath, entryPath)
  return !entryRelativePath.includes('/') && TRANSIENT_ROOT_ENTRIES.has(entryRelativePath)
}

function collectStorageSnapshot(rootPath: string): StorageSnapshot {
  const entries: SnapshotEntry[] = []
  const skippedPaths: string[] = []

  function visit(directoryPath: string): void {
    const directoryEntries = readdirSync(directoryPath, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    for (const directoryEntry of directoryEntries) {
      const entryPath = join(directoryPath, directoryEntry.name)
      const entryRelativePath = portableRelativePath(rootPath, entryPath)
      if (isTransientEntry(rootPath, entryPath)) {
        skippedPaths.push(entryRelativePath)
        continue
      }
      if (directoryEntry.isDirectory()) {
        visit(entryPath)
        continue
      }
      if (!directoryEntry.isFile()) {
        // 原因：用户数据目录可能含锁、套接字或外部符号链接，复制它们会造成越界或平台错误。
        skippedPaths.push(entryRelativePath)
        continue
      }
      const contents = readFileSync(entryPath)
      entries.push({
        path: entryRelativePath,
        size: contents.byteLength,
        sha256: createHash('sha256').update(contents).digest('hex')
      })
    }
  }

  visit(rootPath)
  const digest = createHash('sha256')
  let totalBytes = 0
  for (const entry of entries) {
    totalBytes += entry.size
    digest.update(`${entry.path}\0${entry.size}\0${entry.sha256}\n`)
  }
  return {
    digest: digest.digest('hex'),
    fileCount: entries.length,
    totalBytes,
    entries,
    skippedPaths
  }
}

function copyStorageDirectory(
  sourcePath: string,
  targetPath: string,
  sourceRootPath = sourcePath
): void {
  mkdirSync(targetPath, { recursive: true })
  const entries = readdirSync(sourcePath, { withFileTypes: true })
  for (const entry of entries) {
    const sourceEntryPath = join(sourcePath, entry.name)
    if (isTransientEntry(sourceRootPath, sourceEntryPath)) {
      continue
    }
    const targetEntryPath = join(targetPath, entry.name)
    if (entry.isDirectory()) {
      copyStorageDirectory(sourceEntryPath, targetEntryPath, sourceRootPath)
    } else if (entry.isFile()) {
      copyFileSync(sourceEntryPath, targetEntryPath)
    }
  }
}

function isDirectoryEmpty(directoryPath: string): boolean {
  return !existsSync(directoryPath) || readdirSync(directoryPath).length === 0
}

function legacyCandidateNames(isDev: boolean): string[] {
  return isDev ? ['orca-dev'] : ['orca', 'Orca', 'orca-ide']
}

function getCandidateScore(candidatePath: string): [number, number] {
  const primaryDataPath = join(candidatePath, 'orca-data.json')
  if (existsSync(primaryDataPath)) {
    return [2, lstatSync(primaryDataPath).mtimeMs]
  }
  const profileIndexPath = join(candidatePath, 'orca-profile-index.json')
  return existsSync(profileIndexPath) ? [1, lstatSync(profileIndexPath).mtimeMs] : [0, 0]
}

function resolveLegacyCandidates(options: UserDataMigrationOptions): string[] {
  const targetPath = resolve(options.targetUserDataPath)
  const candidates = legacyCandidateNames(options.isDev)
    .map((name) => join(options.appDataPath, name))
    .filter((candidatePath) => resolve(candidatePath) !== targetPath)
    .filter((candidatePath) => existsSync(candidatePath) && !isDirectoryEmpty(candidatePath))

  const deduplicated = new Map<string, string>()
  for (const candidatePath of candidates) {
    const key = resolve(candidatePath)
    if (!deduplicated.has(key)) {
      deduplicated.set(key, candidatePath)
    }
  }
  return [...deduplicated.values()].sort((left, right) => {
    const [leftRank, leftMtime] = getCandidateScore(left)
    const [rightRank, rightMtime] = getCandidateScore(right)
    return rightRank - leftRank || rightMtime - leftMtime
  })
}

function readSourceVersion(sourcePath: string): string | null {
  const dataPath = join(sourcePath, 'orca-data.json')
  if (!existsSync(dataPath)) {
    return null
  }
  try {
    const parsed = JSON.parse(readFileSync(dataPath, 'utf-8')) as Record<string, unknown>
    const version = parsed.appVersion ?? parsed.version ?? parsed.schemaVersion
    return typeof version === 'string' || typeof version === 'number' ? String(version) : null
  } catch {
    return null
  }
}

function snapshotsMatch(source: StorageSnapshot, target: StorageSnapshot): boolean {
  return (
    source.digest === target.digest &&
    source.fileCount === target.fileCount &&
    source.totalBytes === target.totalBytes
  )
}

function writeFailureManifest(stagingPath: string, details: Record<string, unknown>): void {
  try {
    mkdirSync(stagingPath, { recursive: true })
    writeFileSync(
      join(stagingPath, MIGRATION_MANIFEST_FILE),
      `${JSON.stringify({ schemaVersion: 1, status: 'failed', ...details }, null, 2)}\n`,
      'utf-8'
    )
  } catch {
    // 失败目录只用于人工恢复，无法写清单时仍保留原始异常作为启动错误。
  }
}

export function migrateLegacyUserDataDirectory(
  options: UserDataMigrationOptions
): UserDataMigrationResult {
  const targetPath = options.targetUserDataPath
  if (!isDirectoryEmpty(targetPath)) {
    return { status: 'target-not-empty', targetPath }
  }

  const candidatePaths = resolveLegacyCandidates(options)
  const sourcePath = candidatePaths[0]
  if (!sourcePath) {
    return { status: 'no-legacy-data', targetPath }
  }

  const startedAt = (options.now ?? (() => new Date()))().toISOString()
  const stagingPath = `${targetPath}.migration-${process.pid}-${randomUUID()}`
  try {
    const sourceSnapshot = collectStorageSnapshot(sourcePath)
    copyStorageDirectory(sourcePath, stagingPath)
    const targetSnapshot = collectStorageSnapshot(stagingPath)
    if (!snapshotsMatch(sourceSnapshot, targetSnapshot)) {
      throw new Error('复制后的文件校验不一致')
    }

    const completedAt = (options.now ?? (() => new Date()))().toISOString()
    const manifestPath = join(stagingPath, MIGRATION_MANIFEST_FILE)
    writeFileSync(
      manifestPath,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          status: 'completed',
          sourcePath,
          targetPath,
          alternateSourcePaths: candidatePaths.slice(1),
          sourceVersion: readSourceVersion(sourcePath),
          migratedByVersion: options.appVersion,
          startedAt,
          completedAt,
          verification: {
            algorithm: 'sha256',
            matched: true,
            digest: sourceSnapshot.digest,
            fileCount: sourceSnapshot.fileCount,
            totalBytes: sourceSnapshot.totalBytes,
            skippedPaths: sourceSnapshot.skippedPaths
          }
        },
        null,
        2
      )}\n`,
      'utf-8'
    )

    if (existsSync(targetPath)) {
      if (!isDirectoryEmpty(targetPath)) {
        rmSync(stagingPath, { recursive: true, force: true })
        return { status: 'target-not-empty', targetPath }
      }
      rmSync(targetPath, { recursive: true })
    }
    renameSync(stagingPath, targetPath)
    return {
      status: 'migrated',
      sourcePath,
      targetPath,
      manifestPath: join(targetPath, basename(manifestPath))
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    writeFailureManifest(stagingPath, {
      sourcePath,
      targetPath,
      startedAt,
      failedAt: (options.now ?? (() => new Date()))().toISOString(),
      error: message
    })
    return { status: 'failed', sourcePath, targetPath, stagingPath, error: message }
  }
}

export function migrateLegacyStorageFile(targetPath: string, legacyPaths: string[]): boolean {
  if (existsSync(targetPath)) {
    return false
  }
  const sourcePath = legacyPaths.find((candidatePath) => existsSync(candidatePath))
  if (!sourcePath) {
    return false
  }
  mkdirSync(dirname(targetPath), { recursive: true })
  const temporaryPath = `${targetPath}.migration-${randomUUID()}.tmp`
  copyFileSync(sourcePath, temporaryPath)
  renameSync(temporaryPath, targetPath)
  return true
}
