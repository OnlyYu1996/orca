export function formatCommandFlagHelp(flag: string, commandPath: string[]): string {
  const command = commandPath.join(' ')
  if (command === 'linear issue' && flag === 'id') {
    return '--id <id>             Linear Issue 标识、ID 或 URL'
  }
  if (command === 'linear issue' && flag === 'workspace') {
    return '--workspace <id>      已连接的 Linear 工作区 ID'
  }
  if (command === 'linear search' && flag === 'query') {
    return '--query <text>        在 Linear Issue 中搜索的文本'
  }
  if (command === 'linear search' && flag === 'workspace') {
    return '--workspace <id|all>  已连接的 Linear 工作区 ID，或 all'
  }
  if (command.startsWith('linear ') && flag === 'workspace') {
    return '--workspace <id>      已连接的 Linear 工作区 ID'
  }
  if (command.startsWith('linear ') && flag === 'body') {
    return '--body <text>         Linear 评论或 Issue 正文'
  }
  if (command.startsWith('linear ') && flag === 'body-file') {
    return '--body-file <path|->  从文件或标准输入读取 Linear 正文'
  }
  if (command.startsWith('linear ') && flag === 'write-id') {
    return '--write-id <uuid>     linear_write_unconfirmed 返回的重试 ID'
  }
  if (command.startsWith('linear ') && flag === 'to') {
    return '--to <state>          精确的 Linear 工作流状态名称'
  }
  if (command === 'linear comment add' && flag === 'reply-to') {
    return '--reply-to <id>       要回复的评论 ID'
  }
  if (command === 'linear attach' && flag === 'url') {
    return '--url <url>           要附加的绝对 http(s) 链接'
  }
  if (command === 'linear attach' && flag === 'title') {
    return '--title <text>        附件标题'
  }
  if (command === 'linear create' && flag === 'title') {
    return '--title <text>        新 Linear Issue 标题'
  }
  if (command === 'linear create' && flag === 'team') {
    return '--team <key>          Linear 团队标识'
  }
  if (command === 'linear create' && flag === 'parent') {
    return '--parent <id>         父 Linear Issue 标识、ID 或 URL'
  }
  if (command === 'linear create' && flag === 'parent-current') {
    return '--parent-current      使用当前关联 Issue 作为父项'
  }
  if (command === 'worktree create' && flag === 'parent-worktree') {
    return '--parent-worktree <selector> 父工作树选择器，例如 active/current、id:<repo-id>::<path>、branch:<branch>、issue:<number>、path:<path>、folder:<id> 或 worktree:<worktreeId>'
  }
  if (command === 'orchestration task-create' && flag === 'task-title') {
    return '--task-title <text>  编排任务的精简标题'
  }
  if (command === 'orchestration task-create' && flag === 'display-name') {
    return '--display-name <text> 分派工作进程行显示的界面标签'
  }
  if (flag === 'key' && command === 'computer hotkey') {
    return '--key <key-combo>      修饰键与单键组合，例如 CmdOrCtrl+A'
  }
  if (flag === 'key' && command === 'computer press-key') {
    return '--key <key>            单个按键，例如 Return、Escape、Tab、Left 或 PageUp'
  }
  return formatFlagHelp(flag)
}

export function formatFlagHelp(flag: string): string {
  const helpByFlag: Record<string, string> = {
    agent: '--agent <id>          在首个终端中启动已知 TUI 智能体',
    'base-branch': '--base-branch <ref>    创建工作树所基于的分支或引用',
    command: '--command <text>       终端启动时运行的命令',
    comment: '--comment <text>       保存在赛博包工头元数据中的评论',
    cursor: '--cursor <n>           上次读取返回的行游标，仅返回新输出',
    action: '--action <name>       辅助功能次要操作名称',
    activate: '--activate             在赛博包工头中显示新工作树',
    app: '--app <app>            应用名称、Bundle ID 或 pid:N',
    direction: '--direction <dir>      滚动方向 up|down|left|right，或拆分方向 horizontal|vertical',
    'display-name': '--display-name <name>  覆盖赛博包工头显示名称',
    'element-index': '--element-index <n>   get-app-state 返回的元素索引',
    title: '--title <text>         终端标签页自定义标题，省略可重置',
    enter: '--enter                发送文本后追加 Enter',
    force: '--force                在支持时强制移除工作树',
    focus: '--focus                在赛博包工头中显示新建终端会话',
    for: '--for exit|tui-idle    要等待满足的条件',
    'from-element-index': '--from-element-index <n> get-app-state 返回的源元素索引',
    'from-x': '--from-x <x>           源窗口局部 x 坐标',
    'from-y': '--from-y <y>           源窗口局部 y 坐标',
    help: '--help                 显示帮助',
    interrupt: '--interrupt            在支持时作为中断式输入发送',
    id: '--id <id>             目标项目或权限的标识',
    issue: '--issue <number|null>  关联的 GitHub Issue 编号',
    'linear-issue':
      '--linear-issue <id|url|null> 关联的 Linear Issue 标识或 URL；设置时传 null 可清除',
    json: '--json                 输出机器可读 JSON',
    key: '--key <key>            此命令使用的按键参数',
    limit: '--limit <n>            最大返回行数',
    mode: '--mode <mode>          edit、diff 或 both 等模式',
    'mouse-button': '--mouse-button <btn>   鼠标按键：left、right 或 middle',
    name: '--name <name>          新工作树或自动化名称',
    'no-parent': '--no-parent            强制不记录无关工作的父级关系',
    'no-screenshot': '--no-screenshot       操作后跳过截图',
    pages: '--pages <n>           滚动页数',
    'parent-worktree':
      '--parent-worktree <selector> 父工作树选择器，例如 id:<repo-id>::<path>、branch:<branch>、issue:<number>、path:<path> 或 active/current',
    path: '--path <path>          命令使用的路径参数',
    prompt: '--prompt <text>        智能体命令使用的提示词',
    query: '--query <text>        用于匹配引用的搜索文本',
    ref: '--ref <ref>            要为仓库保存的基准引用',
    repo: '--repo <selector>      仓库选择器，例如 id:<id>、name:<name> 或 path:<path>',
    'restore-window': '--restore-window     操作前将目标应用或窗口置于前台',
    session: '--session <id>        相关电脑控制流程的快照命名空间',
    setup: '--setup run|skip|inherit 仓库定义 Setup Hook 的执行策略',
    terminal: '--terminal <handle>  运行时签发的终端句柄',
    text: '--text <text>          要发送或输入的文本载荷',
    'text-stdin': '--text-stdin          从标准输入读取文本载荷',
    'task-id': '--task-id <id>        写入编排载荷 JSON 的任务 ID',
    'task-title': '--task-title <text>    编排任务的精简标题',
    'dispatch-id': '--dispatch-id <id>    写入编排载荷 JSON 的分派 ID',
    'files-modified': '--files-modified <csv> 写入编排载荷 JSON 的逗号分隔文件列表',
    'report-path': '--report-path <path>  写入编排载荷 JSON 的报告路径',
    phase: '--phase <text>        写入编排载荷 JSON 的工作进程阶段',
    'timeout-ms': '--timeout-ms <ms>     最大等待时间',
    'to-element-index': '--to-element-index <n> get-app-state 返回的目标元素索引',
    'to-x': '--to-x <x>             目标窗口局部 x 坐标',
    'to-y': '--to-y <y>             目标窗口局部 y 坐标',
    worktree:
      '--worktree <selector>  工作树选择器，例如 id:<repo-id>::<path>、name:<displayName>、branch:<branch>、issue:<number>、path:<path> 或 active/current',
    workspace: '--workspace <selector> 自动化运行使用的现有工作树选择器',
    'workspace-status':
      '--workspace-status <id> 看板状态 ID，默认值包括 todo、in-progress、in-review、completed',
    staged: '--staged               打开已暂存的源代码管理变更',
    provider: '--provider <agent>     智能体 ID，例如 codex、claude 或 gemini',
    'source-context':
      '--source-context <json|null> 自动化任务或提供器数据使用的显式 TaskSourceContext',
    trigger: '--trigger <schedule>   自动化计划预设、cron 或 RRULE',
    schedule: '--schedule <schedule>  --trigger 的别名',
    time: '--time <HH:MM>        daily、weekdays、weekly 预设使用的时间',
    day: '--day <0-6>           weekly 预设使用的星期，星期日为 0',
    timezone: '--timezone <tz>       自动化使用的 IANA 时区',
    enabled: '--enabled              启用自动化',
    disabled: '--disabled             禁用自动化',
    'reuse-session': '--reuse-session        对现有工作区运行复用上一个活动会话',
    'fresh-session': '--fresh-session        后续运行不复用会话',
    'workspace-mode': '--workspace-mode <mode> existing 或 new-per-run',
    'missed-run-grace-minutes': '--missed-run-grace-minutes <n> 错过运行后的宽限窗口',
    'value-stdin': '--value-stdin         从标准输入读取 set-value 载荷',
    'window-id': '--window-id <id>      list-windows 返回的目标窗口 ID',
    'window-index': '--window-index <n>   list-windows 返回的目标窗口索引',
    // 浏览器自动化选项
    element: '--element <ref>        snapshot 返回的元素引用，例如 e3',
    url: '--url <url>            要导航到的 URL',
    value: '--value <text>         要填写或选择的值',
    input: '--input <text>         在当前焦点处输入的文本',
    expression: '--expression <js>     要执行的 JavaScript 表达式',
    amount: '--amount <pixels>      滚动像素距离',
    index: '--index <n>            要切换到的标签页索引',
    page: '--page <id>            `sbbgt tab list --json` 返回的稳定页面 ID',
    profile: '--profile <id>        浏览器配置 ID',
    'show-profile': '--show-profile        在文本输出中包含标签页配置',
    format: '--format <png|jpeg>    截图格式'
  }

  if (flag === 'current') {
    return '--current              使用当前赛博包工头工作树关联的 Linear Issue'
  }
  if (flag === 'comments') {
    return '--comments             包含 Linear 评论线程'
  }
  if (flag === 'children') {
    return '--children             递归包含子 Issue'
  }
  if (flag === 'depth') {
    return '--depth <n>            --children/--full 使用的子 Issue 深度'
  }
  if (flag === 'attachments') {
    return '--attachments          包含附件元数据和 URL'
  }
  if (flag === 'relations') {
    return '--relations            包含阻塞、相关和重复关系链接'
  }
  if (flag === 'full') {
    return '--full                 在上限内包含全部受支持的 V1 Issue 上下文'
  }

  return helpByFlag[flag] ?? `--${flag}`
}
