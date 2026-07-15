export function computerProviderUnavailableMessage(platform: NodeJS.Platform): string {
  if (platform === 'darwin') {
    return [
      'macOS 原生 computer-use 提供器不可用：未找到赛博包工头电脑控制.app，或当前 macOS 版本不受支持。',
      '本地开发时，请运行 pnpm build:computer-macos，然后从当前工作树重启赛博包工头。'
    ].join(' ')
  }
  if (platform === 'linux' || platform === 'win32') {
    return `computer-use has no native provider for ${platform}; the platform runtime file was not found`
  }
  return `computer-use has no native provider for ${platform}`
}
