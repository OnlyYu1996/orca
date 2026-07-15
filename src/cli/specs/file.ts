import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

export const FILE_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['file', 'open'],
    summary: 'Open a workspace file in the Orca editor',
    usage: 'sbbgt file open <path> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'path', 'worktree'],
    positionalArgs: ['path'],
    notes: [
      'The path is relative to the selected worktree. When --worktree is omitted, local CLI calls infer the current Orca worktree from cwd.'
    ],
    examples: [
      'sbbgt file open src/App.tsx',
      'sbbgt file open --path docs/readme.md --worktree active'
    ]
  },
  {
    path: ['file', 'diff'],
    summary: 'Open a workspace file diff in the Orca editor',
    usage: 'sbbgt file diff <path> [--staged] [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'path', 'staged', 'worktree'],
    positionalArgs: ['path'],
    notes: [
      'Diffs default to unstaged changes. Pass --staged to open the staged source-control diff.'
    ],
    examples: [
      'sbbgt file diff src/App.tsx',
      'sbbgt file diff --path package.json --staged --worktree branch:feature'
    ]
  },
  {
    path: ['file', 'open-changed'],
    summary: 'Open all git-changed files for a workspace',
    usage: 'sbbgt file open-changed [--mode edit|diff|both] [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'mode', 'worktree'],
    notes: [
      'For v1, changed files come from git status for the selected worktree.',
      'The default mode is diff. Edit mode skips deleted files because there is no file to open.'
    ],
    examples: [
      'sbbgt file open-changed',
      'sbbgt file open-changed --mode both',
      'sbbgt file open-changed --mode diff --worktree active'
    ]
  }
]
