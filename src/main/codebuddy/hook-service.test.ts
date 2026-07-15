import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getPath: () => '/tmp/orca-user-data'
  }
}))

import { CLAUDE_EVENTS } from '../claude/hook-settings'
import { createAgentHookMemorySftp } from '../agent-hooks/agent-hook-memory-sftp.test-fixture'
import { codeBuddyHookService } from './hook-service'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('CodeBuddy hook service', () => {
  it('preserves user settings while installing local managed hooks', () => {
    const home = mkdtempSync(join(tmpdir(), 'orca-codebuddy-hooks-'))
    vi.stubEnv('HOME', home)
    vi.stubEnv('USERPROFILE', home)
    try {
      const configDir = join(home, '.codebuddy')
      const configPath = join(configDir, 'settings.json')
      mkdirSync(configDir, { recursive: true })
      writeFileSync(
        configPath,
        JSON.stringify({
          model: 'codebuddy-default',
          hooks: { Stop: [{ hooks: [{ type: 'command', command: '/usr/local/bin/user-hook' }] }] }
        })
      )

      expect(codeBuddyHookService.install().state).toBe('installed')

      const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
        model: string
        hooks: Record<string, { hooks: { command: string }[] }[]>
      }
      expect(config.model).toBe('codebuddy-default')
      expect(
        config.hooks.Stop.flatMap((entry) => entry.hooks.map((hook) => hook.command))
      ).toContain('/usr/local/bin/user-hook')
      for (const event of CLAUDE_EVENTS) {
        expect(
          config.hooks[event.eventName].some((entry) =>
            entry.hooks.some((hook) => hook.command.includes('codebuddy-hook'))
          )
        ).toBe(true)
      }
      const scriptName = process.platform === 'win32' ? 'codebuddy-hook.cmd' : 'codebuddy-hook.sh'
      expect(readFileSync(join(home, '.orca', 'agent-hooks', scriptName), 'utf8')).toContain(
        '/hook/codebuddy'
      )
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  })

  it('installs POSIX hooks into the remote CodeBuddy home', async () => {
    const configPath = '/home/dev/.codebuddy/settings.json'
    const { sftp, fs } = createAgentHookMemorySftp({
      [configPath]: JSON.stringify({ model: 'remote-codebuddy' })
    })

    const status = await codeBuddyHookService.installRemote(sftp, '/home/dev')

    expect(status).toMatchObject({ agent: 'codebuddy', state: 'installed', configPath })
    expect(fs.files.get('/home/dev/.orca/agent-hooks/codebuddy-hook.sh')).toContain(
      '/hook/codebuddy'
    )
    const config = JSON.parse(fs.files.get(configPath) ?? '{}') as {
      model: string
      hooks: Record<string, { hooks: { command: string }[] }[]>
    }
    expect(config.model).toBe('remote-codebuddy')
    expect(config.hooks.UserPromptSubmit[0]?.hooks[0]?.command).toContain('codebuddy-hook.sh')
  })
})
