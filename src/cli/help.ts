import type { CommandSpec } from './args'
import { findCommandSpec, isCommandGroup, supportsBrowserPageFlag } from './args'
import {
  CLI_GROUP_TITLES_ZH,
  formatCliExampleZh,
  getCliCommandSummaryZh,
  getCliNoteZh
} from './cli-help-copy-zh'
import { formatCommandFlagHelp } from './cli-flag-help-zh'
import { unknownCommandData } from './command-suggestion'

export { formatFlagHelp } from './cli-flag-help-zh'

const ROOT_HELP_TEXT = '赛博包工头'

export function printHelp(specs: CommandSpec[], commandPath: string[] = []): void {
  const exactSpec = findCommandSpec(specs, commandPath)
  if (exactSpec) {
    console.log(formatCommandHelp(exactSpec))
    return
  }

  if (isCommandGroup(commandPath)) {
    console.log(formatGroupHelp(specs, commandPath[0]))
    return
  }

  if (commandPath.length > 0) {
    const { nextSteps } = unknownCommandData(specs, commandPath)
    const recovery = nextSteps.map((step) => `下一步：${formatCliExampleZh(step)}`).join('\n')
    console.log(`未知命令：${commandPath.join(' ')}${recovery ? `\n${recovery}` : ''}\n`)
  }

  console.log(formatRootHelp(specs))
}

function formatRootHelp(specs: CommandSpec[]): string {
  const grouped = new Map<string, CommandSpec[]>()
  for (const spec of specs) {
    const title = CLI_GROUP_TITLES_ZH[spec.path[0]] ?? '浏览器自动化'
    const entries = grouped.get(title) ?? []
    entries.push(spec)
    grouped.set(title, entries)
  }

  const productName = ROOT_HELP_TEXT.split('\n', 1)[0]
  const lines = [productName, '', '用法：sbbgt <command> [options]']
  for (const [title, entries] of grouped) {
    lines.push('', `${title}：`)
    const visibleEntries =
      title === 'Linear' ? entries.filter((spec) => spec.path[1] === 'issue') : entries
    for (const spec of visibleEntries) {
      const usage =
        title === 'Linear'
          ? 'linear [<id>] [--current] [--json]'
          : formatCliExampleZh(spec.usage)
              .replace(/^sbbgt\s+/, '')
              .split('\n', 1)[0]
      lines.push(`  ${usage.padEnd(74)} ${getCliCommandSummaryZh(spec.path, spec.summary)}`)
    }
  }

  lines.push(
    '',
    '全局选项：',
    '  --json                            输出机器可读 JSON',
    '  --pairing-code <code>             使用 sbbgt://pair?... 配对码连接远程运行时',
    '  --environment <selector>          使用已保存的远程环境 ID 或名称连接',
    '  --help                            显示帮助',
    '',
    '智能体会话与工作树：',
    '  `worktree create --agent` 会新建检出并启动智能体。',
    '  要在当前工作树启动新的智能体，请运行：',
    '    sbbgt terminal create --worktree active --command "codex"',
    '',
    '行为说明：',
    '  大多数命令需要运行中的赛博包工头运行时；尚未启动时请先运行 `sbbgt open`。',
    '  也可使用 SBBGT_PAIRING_CODE 或 SBBGT_ENVIRONMENT 指定远程运行时。',
    '  旧 ORCA_PAIRING_CODE、ORCA_ENVIRONMENT 与 orca:// 配对码在兼容周期内仍可读取。',
    '',
    '常用示例：',
    '  $ sbbgt open',
    '  $ sbbgt status --json',
    '  $ sbbgt repo list',
    '  $ sbbgt worktree create --name agent-task --agent codex --prompt "你好"',
    '  $ sbbgt terminal list --worktree active --json',
    '  $ sbbgt tab create --url https://example.com',
    '  $ sbbgt snapshot',
    '  $ sbbgt computer permissions'
  )
  return lines.join('\n')
}

export function formatCommandHelp(spec: CommandSpec): string {
  const lines = [
    `sbbgt ${spec.path.join(' ')}`,
    '',
    `用法：${formatCliExampleZh(spec.usage)}`,
    '',
    getCliCommandSummaryZh(spec.path, spec.summary)
  ]
  const displayedFlags =
    spec.argumentMode === 'passthrough'
      ? []
      : supportsBrowserPageFlag(spec.path)
        ? [...spec.allowedFlags, 'page']
        : spec.allowedFlags

  if (displayedFlags.length > 0) {
    lines.push('', '选项：')
    for (const flag of displayedFlags) {
      lines.push(`  ${formatCommandFlagHelp(flag, spec.path)}`)
    }
  }

  if (spec.notes && spec.notes.length > 0) {
    lines.push('', '说明：')
    for (const note of spec.notes) {
      lines.push(`  ${getCliNoteZh(note)}`)
    }
  }

  if (spec.examples && spec.examples.length > 0) {
    lines.push('', '示例：')
    for (const example of spec.examples) {
      lines.push(`  $ ${formatCliExampleZh(example)}`)
    }
  }

  return lines.join('\n')
}

export function formatGroupHelp(specs: CommandSpec[], group: string): string {
  const groupSpecs = specs.filter((spec) => spec.path[0] === group)
  const lines = [`sbbgt ${group}`, '', `用法：sbbgt ${group} <command> [options]`, '', '命令：']
  for (const spec of groupSpecs) {
    lines.push(
      `  ${spec.path.slice(1).join(' ').padEnd(18)} ${getCliCommandSummaryZh(spec.path, spec.summary)}`
    )
  }
  lines.push('', `运行 \`sbbgt ${group} <command> --help\` 查看具体命令用法。`)
  return lines.join('\n')
}
