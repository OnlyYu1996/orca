export const zhCNHostEditMessages = {
  'home.editHost': '编辑主机',
  'hostEdit.missingHost': '缺少主机信息。',
  'hostEdit.removedHost': '此主机已从当前手机移除。',
  'hostEdit.loadFailed': '无法加载主机。',
  'hostEdit.title': '编辑主机',
  'hostEdit.back': '返回',
  'hostEdit.save': '保存',
  'hostEdit.saveHost': '保存主机',
  'hostEdit.help':
    '修改显示名称或连接地址。修改地址只会切换手机连接的位置，不会重新配对。适用于同一台电脑可通过不同 IP 访问的情况，例如家庭局域网和 Tailscale。',
  'hostEdit.name': '名称',
  'hostEdit.address': '地址',
  'hostEdit.hostName': '主机名称',
  'hostEdit.addressPlaceholder': '192.168.1.10:6768',
  'hostEdit.addressHint':
    '支持 IP、主机名:端口、ws:// 或 wss://。未填写端口时使用当前端口，默认值为 6768。',
  'hostEdit.connectsTo': '将连接到 {{endpoint}}',
  'hostEdit.goBack': '返回',
  'hostEdit.enterName': '请输入名称。',
  'hostEdit.saveFailed': '无法保存主机。',
  'hostEdit.enterAddress': '请输入主机地址。',
  'hostEdit.invalidPort': '端口必须在 1–65535 之间。',
  'hostEdit.invalidScheme': '请使用 ws://、wss:// 或主机名:端口。',
  'hostEdit.invalidAddress': '地址无效。',
  'hostEdit.pathNotAllowed': '主机地址不能包含路径或查询参数。',
  'hostEdit.invalidHostname': '主机名无效。',
  'hostEdit.missingHostname': '缺少主机名。'
} as const

export const enHostEditMessages: Record<keyof typeof zhCNHostEditMessages, string> = {
  'home.editHost': 'Edit host',
  'hostEdit.missingHost': 'Missing host.',
  'hostEdit.removedHost': 'This host was removed from this phone.',
  'hostEdit.loadFailed': 'Failed to load host.',
  'hostEdit.title': 'Edit host',
  'hostEdit.back': 'Back',
  'hostEdit.save': 'Save',
  'hostEdit.saveHost': 'Save host',
  'hostEdit.help':
    'Change the display name or connection address. Address edits only switch where this phone connects — they do not re-pair. Use this when the same desktop is reachable at a different IP, for example home LAN or Tailscale.',
  'hostEdit.name': 'Name',
  'hostEdit.address': 'Address',
  'hostEdit.hostName': 'Host name',
  'hostEdit.addressPlaceholder': '192.168.1.10:6768',
  'hostEdit.addressHint':
    'Accepts IP, host:port, or ws:// / wss://. Missing port defaults to the current port, or 6768.',
  'hostEdit.connectsTo': 'Connects to {{endpoint}}',
  'hostEdit.goBack': 'Go back',
  'hostEdit.enterName': 'Enter a name.',
  'hostEdit.saveFailed': 'Failed to save host.',
  'hostEdit.enterAddress': 'Enter a host address.',
  'hostEdit.invalidPort': 'Port must be 1–65535.',
  'hostEdit.invalidScheme': 'Use ws:// or wss:// (or host:port).',
  'hostEdit.invalidAddress': 'Not a valid address.',
  'hostEdit.pathNotAllowed': 'Host must not include a path or query.',
  'hostEdit.invalidHostname': 'Not a valid hostname.',
  'hostEdit.missingHostname': 'Missing hostname.'
}
