import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { i18n } from '@/i18n/i18n'
import {
  formatByteCount,
  formatDownloadFinishedNotice,
  formatLoadFailureDescription,
  formatLoadFailureRecoveryHint,
  formatPermissionNotice,
  formatPopupNotice,
  isCertificateLoadError
} from './browser-notices'

let previousLanguage: string

beforeAll(async () => {
  previousLanguage = i18n.language
  await i18n.changeLanguage('zh')
})

afterAll(async () => {
  await i18n.changeLanguage(previousLanguage)
})

describe('browser notice formatting', () => {
  it('formats denied permissions with safe copy', () => {
    expect(
      formatPermissionNotice({
        browserPageId: 'browser-1',
        permission: 'media',
        origin: 'https://example.com'
      })
    ).toBe('https://example.com 请求摄像头或麦克风访问权限，赛博包工头已拒绝。')
  })

  it('formats popup outcomes', () => {
    expect(
      formatPopupNotice({
        browserPageId: 'browser-1',
        origin: 'https://example.com',
        action: 'opened-in-orca'
      })
    ).toBe('https://example.com 已在赛博包工头中打开新页面。')

    expect(
      formatPopupNotice({
        browserPageId: 'browser-1',
        origin: 'https://example.com',
        action: 'opened-external'
      })
    ).toBe('https://example.com 已在默认浏览器中打开新窗口。')

    expect(
      formatPopupNotice({
        browserPageId: 'browser-1',
        origin: 'unknown',
        action: 'blocked'
      })
    ).toBe('某个网站 尝试打开赛博包工头暂不支持的弹窗。')
  })

  it('formats download completion and byte counts', () => {
    expect(
      formatDownloadFinishedNotice({
        downloadId: 'download-1',
        status: 'completed',
        savePath: '/tmp/report.csv',
        error: null
      })
    ).toBe('已下载到 /tmp/report.csv。')

    expect(
      formatDownloadFinishedNotice({
        downloadId: 'download-2',
        status: 'failed',
        savePath: null,
        error: 'Download failed.'
      })
    ).toBe('Download failed.')

    expect(formatByteCount(512)).toBe('512 B')
    expect(formatByteCount(1024)).toBe('1.0 KB')
    expect(formatByteCount(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('formats load failure copy for localhost and remote pages', () => {
    expect(
      formatLoadFailureDescription(
        {
          code: -102,
          description: 'ERR_CONNECTION_REFUSED',
          validatedUrl: 'http://localhost:3000'
        },
        {
          host: 'localhost:3000',
          isLocalhostLike: true
        }
      )
    ).toBe('无法连接到本地服务器。')

    expect(
      formatLoadFailureRecoveryHint({
        host: 'localhost:3000',
        isLocalhostLike: true
      })
    ).toBe('如果这是本地应用，请确认服务器正在运行并监听预期端口。')

    expect(
      formatLoadFailureDescription(
        {
          code: -105,
          description: 'ERR_NAME_NOT_RESOLVED',
          validatedUrl: 'https://example.com'
        },
        {
          host: 'example.com',
          isLocalhostLike: false
        }
      )
    ).toBe('无法连接到此页面。')

    expect(
      formatLoadFailureRecoveryHint({
        host: 'example.com',
        isLocalhostLike: false
      })
    ).toBeNull()
  })

  it('formats certificate failures without local-server recovery advice', () => {
    const meta = { host: 'localhost:3443', isLocalhostLike: true }
    const loadError = (code: number) => ({
      code,
      description: 'certificate error',
      validatedUrl: 'https://localhost:3443/'
    })

    expect(formatLoadFailureDescription(loadError(-200), meta)).toBe(
      '证书与 localhost:3443 不匹配。'
    )
    expect(formatLoadFailureDescription(loadError(-201), meta)).toBe(
      'localhost:3443 的证书在当前日期和时间无效。'
    )
    expect(formatLoadFailureDescription(loadError(-202), meta)).toBe(
      '赛博包工头不信任为 localhost:3443 颁发证书的机构。'
    )
    expect(formatLoadFailureDescription(loadError(-208), meta)).toBe(
      '赛博包工头无法验证 localhost:3443 的证书。'
    )
    expect(isCertificateLoadError(loadError(-219))).toBe(true)
    expect(isCertificateLoadError(loadError(-215))).toBe(false)
    expect(formatLoadFailureRecoveryHint(meta, loadError(-202))).toBeNull()
  })
})
