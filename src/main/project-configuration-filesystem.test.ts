import { describe, expect, it, vi } from 'vitest'
import {
  readPreferredProjectConfiguration,
  readPreferredProjectPrivateFile
} from './project-configuration-filesystem'

function missing(): NodeJS.ErrnoException {
  return Object.assign(new Error('missing'), { code: 'ENOENT' })
}

describe('project configuration filesystem', () => {
  it('prefers the current remote configuration and reports conflicts', async () => {
    const readFile = vi.fn(async (filePath: string) => ({
      content: filePath.endsWith('sbbgt.yaml') ? 'scripts: {}' : 'legacy: true',
      isBinary: false
    }))

    await expect(readPreferredProjectConfiguration({ readFile }, '/repo')).resolves.toMatchObject({
      filePath: '/repo/sbbgt.yaml',
      source: 'current',
      hasConflict: true,
      result: { content: 'scripts: {}' }
    })
  })

  it('falls back to legacy remote private files without changing the new write path', async () => {
    const readFile = vi.fn(async (filePath: string) => {
      if (filePath.includes('.sbbgt')) {
        throw missing()
      }
      return { content: 'legacy command', isBinary: false }
    })

    await expect(
      readPreferredProjectPrivateFile({ readFile }, '/repo', 'issue-command')
    ).resolves.toMatchObject({
      filePath: '/repo/.orca/issue-command',
      source: 'legacy',
      hasConflict: false
    })
  })

  it('does not hide remote permission failures behind legacy fallback', async () => {
    const denied = Object.assign(new Error('denied'), { code: 'EACCES' })
    const readFile = vi.fn(async () => {
      throw denied
    })

    await expect(readPreferredProjectConfiguration({ readFile }, '/repo')).rejects.toBe(denied)
  })
})
