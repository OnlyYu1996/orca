import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  migrateLegacyStorageFile,
  migrateLegacyUserDataDirectory
} from './product-storage-migration'

const temporaryDirectories: string[] = []

function createFixture(): string {
  const rootPath = mkdtempSync(join(tmpdir(), 'sbbgt-storage-migration-'))
  temporaryDirectories.push(rootPath)
  return rootPath
}

afterEach(() => {
  for (const directoryPath of temporaryDirectories.splice(0)) {
    rmSync(directoryPath, { recursive: true, force: true })
  }
})

describe('migrateLegacyUserDataDirectory', () => {
  it('复制旧目录、校验文件并写入迁移清单', () => {
    const appDataPath = createFixture()
    const sourcePath = join(appDataPath, 'orca')
    const targetPath = join(appDataPath, 'sbbgt')
    mkdirSync(join(sourcePath, 'nested'), { recursive: true })
    writeFileSync(join(sourcePath, 'orca-data.json'), JSON.stringify({ schemaVersion: 7 }))
    writeFileSync(join(sourcePath, 'nested', 'state.txt'), 'durable state')

    const result = migrateLegacyUserDataDirectory({
      appDataPath,
      targetUserDataPath: targetPath,
      isDev: false,
      appVersion: '2.0.0',
      now: () => new Date('2026-07-14T00:00:00.000Z')
    })

    expect(result.status).toBe('migrated')
    expect(readFileSync(join(targetPath, 'nested', 'state.txt'), 'utf-8')).toBe('durable state')
    expect(readFileSync(join(sourcePath, 'nested', 'state.txt'), 'utf-8')).toBe('durable state')
    const manifest = JSON.parse(
      readFileSync(join(targetPath, 'sbbgt-user-data-migration.json'), 'utf-8')
    ) as Record<string, unknown>
    expect(manifest).toMatchObject({
      status: 'completed',
      sourcePath,
      targetPath,
      sourceVersion: '7',
      migratedByVersion: '2.0.0'
    })
    expect(manifest.verification).toMatchObject({ matched: true, fileCount: 2 })
  })

  it('新目录已有数据时不覆盖', () => {
    const appDataPath = createFixture()
    const sourcePath = join(appDataPath, 'orca')
    const targetPath = join(appDataPath, 'sbbgt')
    mkdirSync(sourcePath)
    mkdirSync(targetPath)
    writeFileSync(join(sourcePath, 'orca-data.json'), '{}')
    writeFileSync(join(targetPath, 'sbbgt-data.json'), '{"keep":true}')

    const result = migrateLegacyUserDataDirectory({
      appDataPath,
      targetUserDataPath: targetPath,
      isDev: false,
      appVersion: '2.0.0'
    })

    expect(result.status).toBe('target-not-empty')
    expect(readFileSync(join(targetPath, 'sbbgt-data.json'), 'utf-8')).toBe('{"keep":true}')
  })

  it('开发模式只探测 orca-dev，并迁移到 sbbgt-dev', () => {
    const appDataPath = createFixture()
    const sourcePath = join(appDataPath, 'orca-dev')
    const targetPath = join(appDataPath, 'sbbgt-dev')
    mkdirSync(sourcePath)
    writeFileSync(join(sourcePath, 'orca-data.json'), '{"dev":true}')

    const result = migrateLegacyUserDataDirectory({
      appDataPath,
      targetUserDataPath: targetPath,
      isDev: true,
      appVersion: '2.0.0'
    })

    expect(result.status).toBe('migrated')
    expect(readFileSync(join(targetPath, 'orca-data.json'), 'utf-8')).toBe('{"dev":true}')
  })

  it('忽略 Electron 单实例锁和符号链接等非持久文件', () => {
    const appDataPath = createFixture()
    const sourcePath = join(appDataPath, 'orca')
    const targetPath = join(appDataPath, 'sbbgt')
    mkdirSync(sourcePath)
    writeFileSync(join(sourcePath, 'orca-data.json'), '{}')
    writeFileSync(join(sourcePath, 'SingletonLock'), '1234')

    const result = migrateLegacyUserDataDirectory({
      appDataPath,
      targetUserDataPath: targetPath,
      isDev: false,
      appVersion: '2.0.0'
    })

    expect(result.status).toBe('migrated')
    expect(existsSync(join(targetPath, 'SingletonLock'))).toBe(false)
    const manifest = JSON.parse(
      readFileSync(join(targetPath, 'sbbgt-user-data-migration.json'), 'utf-8')
    ) as { verification: { skippedPaths: string[] } }
    expect(manifest.verification.skippedPaths).toContain('SingletonLock')
  })

  it('优先选择含主数据且更新时间更新的旧目录', () => {
    const appDataPath = createFixture()
    const lowerPath = join(appDataPath, 'orca')
    const alternatePath = join(appDataPath, 'orca-ide')
    mkdirSync(lowerPath)
    mkdirSync(alternatePath)
    writeFileSync(join(lowerPath, 'cache.txt'), 'not-primary')
    writeFileSync(join(alternatePath, 'orca-data.json'), '{"selected":true}')

    const result = migrateLegacyUserDataDirectory({
      appDataPath,
      targetUserDataPath: join(appDataPath, 'sbbgt'),
      isDev: false,
      appVersion: '2.0.0'
    })

    expect(result).toMatchObject({ status: 'migrated', sourcePath: alternatePath })
  })
})

describe('migrateLegacyStorageFile', () => {
  it('仅在新文件不存在时原子复制旧文件', () => {
    const rootPath = createFixture()
    const legacyPath = join(rootPath, 'orca-data.json')
    const targetPath = join(rootPath, 'sbbgt-data.json')
    writeFileSync(legacyPath, '{"legacy":true}')

    expect(migrateLegacyStorageFile(targetPath, [legacyPath])).toBe(true)
    expect(readFileSync(targetPath, 'utf-8')).toBe('{"legacy":true}')
    writeFileSync(legacyPath, '{"legacy":false}')
    expect(migrateLegacyStorageFile(targetPath, [legacyPath])).toBe(false)
    expect(readFileSync(targetPath, 'utf-8')).toBe('{"legacy":true}')
  })
})
