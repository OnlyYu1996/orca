import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

export const SKILL_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['skills', 'list'],
    summary: '列出赛博包工头 CLI 内置的版本匹配 Skill 指南',
    usage: 'sbbgt skills list [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    notes: [
      '在本地读取内置指南元数据，不连接赛博包工头运行时。',
      'With --json, prints a topics array of canonical names and one-line descriptions.'
    ]
  },
  {
    path: ['skills', 'get'],
    aliases: [['skills', 'show']],
    summary: '以 Markdown 输出版本匹配的 Skill 指南',
    usage: 'sbbgt skills get <topic> [--full] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'topic', 'full'],
    positionalArgs: ['topic'],
    notes: [
      '在本地读取内置指南内容，不连接赛博包工头运行时。',
      'Use --full to include bundled reference documents when the guide provides them.',
      'Use --json for a deterministic object containing canonical topic metadata and content.'
    ],
    examples: ['sbbgt skills get orca-cli', 'sbbgt skills get orchestration --full']
  }
]
