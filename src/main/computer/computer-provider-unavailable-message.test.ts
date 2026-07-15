import { describe, expect, it } from 'vitest'
import { computerProviderUnavailableMessage } from './computer-provider-unavailable-message'

describe('computerProviderUnavailableMessage', () => {
  it('gives macOS developers the helper build and restart step', () => {
    expect(computerProviderUnavailableMessage('darwin')).toContain(
      '请运行 pnpm build:computer-macos，然后从当前工作树重启赛博包工头'
    )
    expect(computerProviderUnavailableMessage('darwin')).toContain(
      '未找到赛博包工头电脑控制.app，或当前 macOS 版本不受支持'
    )
  })

  it('keeps unsupported platforms explicit', () => {
    expect(computerProviderUnavailableMessage('freebsd')).toBe(
      'computer-use has no native provider for freebsd'
    )
  })
})
