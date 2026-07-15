import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('packaged Windows CLI launcher asset', () => {
  it('keeps orca.cmd as a compatibility proxy to the native sbbgt launcher', () => {
    const launcherPath = join(process.cwd(), 'resources', 'win32', 'bin', 'orca.cmd')
    const launcher = readFileSync(launcherPath, 'utf8')

    expect(launcher).toContain('set "LAUNCHER=%~dp0sbbgt.exe"')
    expect(launcher).toContain('set "SBBGT_LEGACY_CLI=orca"')
    expect(launcher).toContain('"%LAUNCHER%" %*')
    expect(launcher).not.toContain('"%ELECTRON%" "%CLI%" %*')
  })
})
