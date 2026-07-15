import {
  LEGACY_PRODUCT_IDENTITY,
  PRODUCT_CLI_COMMAND,
  PRODUCT_DISPLAY_NAME,
  PRODUCT_URL_SCHEME
} from '../shared/product-identity'

const COMMAND_SUMMARY_ZH: Readonly<Record<string, string>> = {
  open: '启动赛博包工头并等待运行时可用',
  status: '显示应用、运行时和图谱就绪状态',
  'claude-teams': '在当前赛博包工头终端中启动 Claude Code Agent Teams',
  'repo list': '列出已注册到赛博包工头的仓库',
  'repo add': '按文件系统路径将项目添加到赛博包工头',
  'repo show': '显示一个已注册仓库',
  'repo set-base-ref': '设置仓库后续工作树的默认基准引用',
  'repo search-refs': '搜索仓库中的分支和标签引用',
  'worktree list': '列出赛博包工头管理的工作树',
  'worktree show': '显示一个工作树',
  'worktree current': '显示当前目录对应的赛博包工头工作树',
  'worktree create': '创建新的赛博包工头工作树',
  'worktree set': '更新工作树的赛博包工头元数据',
  'worktree rm': '从赛博包工头和 Git 中移除工作树',
  'worktree ps': '显示跨工作树的精简编排摘要',
  'terminal list': '列出赛博包工头管理的活动终端',
  'terminal show': '显示终端元数据和预览',
  'terminal read': '读取有限范围的终端输出',
  'terminal send': '向活动终端发送输入',
  'terminal wait': '等待终端满足指定条件',
  'terminal stop': '停止工作树中的终端',
  'terminal create': '在当前工作树中创建终端会话',
  'terminal switch': '在界面中切换到指定终端标签页',
  'terminal close': '关闭终端标签页并在运行时终止 PTY',
  'terminal rename': '设置或清除终端标签页标题',
  'terminal split': '拆分现有终端窗格',
  'project list': '列出赛博包工头已知的持久项目',
  'project setups': '列出项目的主机配置',
  'project setup-existing-folder': '导入现有文件夹，使项目可在主机上使用',
  'project setup-clone': '克隆仓库，使项目可在主机上使用',
  'project setup-create': '创建独立的项目主机配置元数据',
  'project setup-update': '更新项目主机配置元数据',
  'project setup-delete': '移除项目主机配置',
  'file open': '在赛博包工头编辑器中打开工作区文件',
  'file diff': '在赛博包工头编辑器中打开文件差异',
  'file open-changed': '打开工作区内所有 Git 已变更文件',
  'automations list': '列出赛博包工头的计划自动化',
  'automations show': '显示一个赛博包工头自动化',
  'automations create': '创建计划自动化',
  'automations edit': '编辑赛博包工头自动化',
  'automations remove': '移除自动化及其运行历史',
  'automations run': '立即运行赛博包工头自动化',
  'automations runs': '列出自动化运行历史',
  snapshot: '捕获当前浏览器标签页的辅助功能快照',
  screenshot: '捕获当前浏览器标签页的视口截图',
  click: '按引用点击浏览器元素',
  fill: '按引用清空并填写浏览器输入框',
  type: '在当前浏览器焦点处输入文本',
  select: '按引用选择下拉选项',
  scroll: '滚动浏览器视口',
  goto: '将当前浏览器标签页导航到指定 URL',
  back: '在浏览器历史中后退',
  reload: '重新加载当前浏览器标签页',
  eval: '在浏览器页面上下文中执行 JavaScript',
  wait: '等待元素、文本、URL、加载状态、JS 条件或超时',
  check: '按引用选中复选框或单选框',
  uncheck: '按引用取消选中复选框或单选框',
  focus: '按引用聚焦浏览器元素',
  clear: '按引用清空输入元素',
  'select-all': '按引用选中输入框内全部文本',
  keypress: '按下 Enter、Tab、Escape、ArrowDown 等按键',
  pdf: '将当前浏览器标签页导出为 PDF',
  'full-screenshot': '捕获超出视口的整页截图',
  hover: '按引用悬停在浏览器元素上',
  drag: '从一个元素拖动到另一个元素',
  upload: '向文件输入元素上传文件',
  'tab list': '列出打开的浏览器标签页',
  'tab show': '按页面 ID 显示浏览器标签页',
  'tab current': '显示当前浏览器标签页',
  'tab switch': '切换当前浏览器标签页',
  'tab create': '在当前工作树中新建浏览器标签页',
  'tab profile list': '列出浏览器标签页可用的会话配置',
  'tab profile create': '创建浏览器会话配置',
  'tab profile delete': '删除浏览器标签页使用的会话配置',
  'tab profile set': '将浏览器标签页切换到其他配置',
  'tab profile show': '显示浏览器标签页绑定的配置',
  'tab profile use-default': '将浏览器标签页切回默认配置',
  'tab profile clone': '将浏览器标签页克隆到其他配置',
  'tab close': '关闭浏览器标签页',
  exec: '对当前浏览器标签页运行任意 agent-browser 命令',
  'cookie get': '获取当前标签页 Cookie，可按 URL 过滤',
  'cookie set': '设置 Cookie',
  'cookie delete': '按名称删除 Cookie',
  viewport: '设置浏览器视口尺寸',
  geolocation: '覆盖浏览器地理位置',
  'intercept enable': '启用请求拦截并暂停匹配请求',
  'intercept disable': '禁用请求拦截',
  'intercept list': '列出已暂停的拦截请求',
  'capture start': '开始捕获控制台和网络事件',
  'capture stop': '停止捕获控制台和网络事件',
  console: '显示已捕获的控制台日志',
  network: '显示已捕获的网络请求',
  dblclick: '按引用双击元素',
  forward: '在浏览器历史中前进',
  scrollintoview: '将元素滚动到可见区域',
  get: '获取元素的文本、HTML、值、URL、标题、数量或边界框',
  is: '检查元素是否可见、可用或已选中',
  inserttext: '不触发按键事件地插入文本',
  'mouse move': '将鼠标移动到 x、y 坐标',
  'mouse down': '按下鼠标按键',
  'mouse up': '释放鼠标按键',
  'mouse wheel': '滚动鼠标滚轮',
  find: '按语义定位器查找元素并执行操作',
  'set device': '模拟指定设备',
  'set offline': '切换离线模式',
  'set headers': '设置额外 HTTP 请求头',
  'set credentials': '设置 HTTP 身份验证凭据',
  'set media': '设置配色方案和减少动态效果偏好',
  'clipboard read': '读取剪贴板内容',
  'clipboard write': '向剪贴板写入文本',
  'dialog accept': '接受浏览器对话框',
  'dialog dismiss': '关闭浏览器对话框',
  'storage local get': '按键读取 localStorage 值',
  'storage local set': '设置 localStorage 值',
  'storage local clear': '清空 localStorage',
  'storage session get': '按键读取 sessionStorage 值',
  'storage session set': '设置 sessionStorage 值',
  'storage session clear': '清空 sessionStorage',
  download: '点击选择器并下载文件',
  highlight: '按选择器高亮元素',
  'orchestration send': '发送智能体间消息',
  'orchestration check': '检查终端消息',
  'orchestration reply': '回复消息',
  'orchestration inbox': '显示全部或指定接收方的消息',
  'orchestration task-create': '创建编排任务',
  'orchestration task-list': '列出编排任务',
  'orchestration task-update': '更新任务状态',
  'orchestration dispatch': '将任务分派给终端',
  'orchestration dispatch-show': '显示任务的分派上下文',
  'orchestration ask': '向协调器提问并阻塞等待回复',
  'orchestration run': '启动协调器循环',
  'orchestration run-stop': '停止当前协调器运行',
  'orchestration gate-create': '创建阻塞任务的决策门',
  'orchestration gate-resolve': '解决待处理决策门',
  'orchestration gate-list': '列出决策门',
  'orchestration reset': '重置一个范围的编排状态；裸命令重置全部',
  'computer capabilities': '显示电脑控制提供器能力',
  'computer list-apps': '列出电脑控制可用的运行中应用',
  'computer permissions': '打开电脑控制权限设置',
  'computer list-windows': '列出电脑控制可用的应用窗口',
  'computer get-app-state': '捕获应用的精简辅助功能快照',
  'computer click': '点击应用元素或窗口坐标',
  'computer perform-secondary-action': '执行已声明的辅助功能次要操作',
  'computer scroll': '滚动应用元素或窗口坐标',
  'computer drag': '在应用元素或窗口坐标之间拖动',
  'computer type-text': '在当前应用焦点处输入原样文本',
  'computer press-key': '按下 Return、Escape 等单个按键',
  'computer hotkey': '按下平台感知的组合键',
  'computer paste-text': '在当前应用焦点处粘贴精确文本',
  'computer set-value': '设置可写应用元素的值',
  'agent hooks status': '显示赛博包工头管理的智能体状态 Hook 是否启用',
  'agent hooks off': '禁用智能体状态 Hook 并移除本地 Hook 条目',
  'agent hooks on': '启用赛博包工头管理的智能体状态 Hook',
  'diagnostics memory': '采集赛博包工头及其托管终端的内存快照',
  'agent-context': '输出供智能体使用的机器可读命令 Schema',
  'environment add': '通过配对码保存远程赛博包工头运行时环境',
  'environment list': '列出已保存的远程运行时环境',
  'environment show': '显示一个已保存的远程运行时环境',
  'environment rm': '移除一个已保存的远程运行时环境',
  'linear issue': '读取供智能体使用的 Linear Issue 上下文',
  'linear search': '搜索已连接 Linear 工作区',
  'linear team list': '列出已连接的 Linear 团队',
  'linear team members': '列出 Linear 团队成员',
  'linear team states': '列出 Linear 团队工作流状态',
  'linear team labels': '列出 Linear 团队标签',
  'linear project list': '列出已连接的 Linear 项目',
  'linear list': '列出用于任务分流的 Linear Issue',
  'linear status set': '设置 Linear Issue 状态',
  'linear assignee set': '分配 Linear Issue',
  'linear assignee clear': '清除 Linear Issue 负责人',
  'linear priority set': '设置 Linear Issue 优先级',
  'linear priority clear': '清除 Linear Issue 优先级',
  'linear estimate set': '设置 Linear Issue 估算',
  'linear estimate clear': '清除 Linear Issue 估算',
  'linear due-date set': '设置 Linear Issue 截止日期',
  'linear due-date clear': '清除 Linear Issue 截止日期',
  'linear label add': '为 Linear Issue 添加标签',
  'linear label remove': '从 Linear Issue 移除标签',
  'linear label set': '替换 Linear Issue 标签',
  'linear comment add': '为 Linear Issue 添加评论',
  'linear attach': '为 Linear Issue 附加链接',
  'linear create': '创建 Linear Issue',
  'vm recipe doctor': '验证工作区环境配方，默认不执行配置',
  serve: '启动不打开桌面窗口的赛博包工头运行时服务器',
  'emulator list': '列出可用或运行中的模拟器',
  'emulator devices': '列出 iOS 和 Android 的全部模拟器设备与 AVD',
  'emulator attach': '为设备启动辅助程序并设为工作树当前设备',
  'emulator tap': '按归一化坐标点击设备',
  'emulator type': '输入仅限 US ASCII 的文本',
  'emulator gesture': '发送多点手势序列',
  'emulator button': '按下 home、side_button 等硬件按键',
  'emulator rotate': '旋转设备',
  'emulator exec': '执行原始 serve-sim 子命令',
  'emulator kill': '停止设备辅助程序',
  'emulator shutdown': '停止辅助程序并关闭模拟器设备',
  'emulator install': '向目标 Android 设备安装 APK',
  'emulator launch': '按包名和可选 Activity 启动 Android 应用',
  'emulator permissions': '授予、撤销或重置 Android 运行时权限',
  'emulator ax': '输出 Android 辅助功能树',
  'emulator logcat': '采集一次 Android logcat 输出'
}

export const CLI_GROUP_TITLES_ZH: Readonly<Record<string, string>> = {
  open: '启动',
  serve: '启动',
  status: '启动',
  'claude-teams': '启动',
  diagnostics: '诊断',
  'agent-context': '智能体发现',
  skills: 'Skill 指南',
  environment: '远程环境',
  vm: '环境配方',
  automations: '自动化',
  project: '项目',
  repo: '仓库',
  worktree: '工作树',
  file: '文件',
  terminal: '终端',
  orchestration: '多智能体编排',
  computer: '电脑控制',
  linear: 'Linear',
  emulator: '移动模拟器',
  agent: '智能体 Hook',
  browser: '浏览器自动化'
}

const NOTE_COPY_ZH: Readonly<Record<string, string>> = {
  '--brief collapses whitespace and caps each spec at 160 characters.':
    '--brief 会合并空白，并将每条说明限制为 160 个字符。',
  'Valid --status values: pending, ready, dispatched, completed, failed, blocked.':
    '--status 可用值：pending、ready、dispatched、completed、failed、blocked。',
  'A setup means a project is available on a host at a concrete filesystem path.':
    '配置表示项目可通过主机上的具体文件系统路径使用。',
  'For remote runtimes, --path must be an absolute path on the remote server.':
    '对于远程运行时，--path 必须是远程服务器上的绝对路径。',
  'Use --body-file - to read multiline comment bodies from stdin.':
    '使用 --body-file - 从标准输入读取多行评论正文。',
  'Use --body-file - to read multiline issue bodies from stdin.':
    '使用 --body-file - 从标准输入读取多行 Issue 正文。',
  'Omit --title or pass an empty string to reset to the auto-generated title.':
    '省略 --title 或传入空字符串，可恢复自动生成的标题。',
  'This creates a new checkout. For a fresh agent in an existing worktree, use `orca terminal create --worktree active --command "codex"` instead.':
    '此命令会创建新的检出。要在现有工作树中启动新智能体，请改用 `sbbgt terminal create --worktree active --command "codex"`。',
  '--no-parent only affects Orca lineage; omit --base-branch to use the repo default base, or pass the default base ref explicitly for independent top-level work.':
    '--no-parent 只影响赛博包工头的父子关系；省略 --base-branch 会使用仓库默认基准，也可为独立顶层工作显式传入默认基准引用。',
  'Creates a visible terminal tab without switching focus when possible; falls back to a background handle if the UI cannot adopt it. Pass --focus to switch to it.':
    '尽可能创建可见终端标签页但不切换焦点；界面无法接管时回退为后台句柄。传入 --focus 可切换到该终端。',
  'Use this, not worktree create, for a fresh agent in the current checkout.':
    '要在当前检出中启动新智能体，请使用此命令，而不是 worktree create。'
}

export function getCliCommandSummaryZh(commandPath: readonly string[], fallback: string): string {
  return COMMAND_SUMMARY_ZH[commandPath.join(' ')] ?? fallback
}

export function getCliNoteZh(note: string): string {
  return NOTE_COPY_ZH[note] ?? formatCliProductTextZh(note)
}

export function formatCliProductTextZh(value: string): string {
  return value
    .replaceAll(LEGACY_PRODUCT_IDENTITY.displayName, PRODUCT_DISPLAY_NAME)
    .replaceAll(`${LEGACY_PRODUCT_IDENTITY.urlScheme}://`, `${PRODUCT_URL_SCHEME}://`)
    .replace(
      new RegExp(`\\b${LEGACY_PRODUCT_IDENTITY.machineName}(?=\\s)`, 'g'),
      PRODUCT_CLI_COMMAND
    )
}

export function formatCliExampleZh(example: string): string {
  return replaceLeadingLegacyCliCommand(example)
    .replaceAll(`${LEGACY_PRODUCT_IDENTITY.urlScheme}://pair`, `${PRODUCT_URL_SCHEME}://pair`)
    .replaceAll('ORCA_PAIRING_CODE', 'SBBGT_PAIRING_CODE')
    .replaceAll('ORCA_ENVIRONMENT', 'SBBGT_ENVIRONMENT')
}

function replaceLeadingLegacyCliCommand(value: string): string {
  const legacyCommand = LEGACY_PRODUCT_IDENTITY.machineName
  if (value === legacyCommand) {
    return PRODUCT_CLI_COMMAND
  }
  if (value.startsWith(`${legacyCommand} `)) {
    return `${PRODUCT_CLI_COMMAND}${value.slice(legacyCommand.length)}`
  }
  return value
}
