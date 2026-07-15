import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

export const ENVIRONMENT_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['environment', 'add'],
    summary: 'Save a remote Orca runtime environment from a pairing code',
    usage: 'sbbgt environment add --name <name> --pairing-code <code> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'name'],
    examples: ['sbbgt environment add --name work-laptop --pairing-code sbbgt://pair?code=...']
  },
  {
    path: ['environment', 'list'],
    summary: 'List saved Orca runtime environments',
    usage: 'sbbgt environment list [--json]',
    allowedFlags: [...GLOBAL_FLAGS]
  },
  {
    path: ['environment', 'show'],
    summary: 'Show one saved Orca runtime environment',
    usage: 'sbbgt environment show --environment <selector> [--json]',
    allowedFlags: [...GLOBAL_FLAGS]
  },
  {
    path: ['environment', 'rm'],
    destructive: true,
    summary: 'Remove one saved Orca runtime environment',
    usage: 'sbbgt environment rm --environment <selector> [--json]',
    allowedFlags: [...GLOBAL_FLAGS]
  }
]
