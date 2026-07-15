import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

export const AGENT_HOOK_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['agent', 'hooks', 'status'],
    summary: 'Show whether Orca-managed agent status hooks are enabled',
    usage: 'sbbgt agent hooks status [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    examples: ['sbbgt agent hooks status', 'sbbgt agent hooks status --json']
  },
  {
    path: ['agent', 'hooks', 'off'],
    summary: 'Disable Orca-managed agent status hooks and remove local hook entries',
    usage: 'sbbgt agent hooks off [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    examples: ['sbbgt agent hooks off']
  },
  {
    path: ['agent', 'hooks', 'on'],
    summary: 'Enable Orca-managed agent status hooks',
    usage: 'sbbgt agent hooks on [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    examples: ['sbbgt agent hooks on']
  }
]
