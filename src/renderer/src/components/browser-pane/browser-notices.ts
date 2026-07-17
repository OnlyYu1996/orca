import type {
  BrowserDownloadFinishedEvent,
  BrowserPermissionDeniedEvent,
  BrowserPopupEvent
} from '../../../../shared/browser-guest-events'
import type { BrowserLoadError } from '../../../../shared/types'
import { isChromiumCertificateErrorCode } from '../../../../shared/browser-certificate-errors'
import { translate } from '@/i18n/i18n'

export type LoadFailureMeta = {
  host: string | null
  isLocalhostLike: boolean
}

type BrowserLoadErrorLike = BrowserLoadError | null

function humanizePermission(permission: string): string {
  switch (permission) {
    case 'media':
      return '摄像头或麦克风访问权限'
    case 'pointerLock':
      return '指针锁定权限'
    default:
      return permission
  }
}

export function formatPermissionNotice(event: BrowserPermissionDeniedEvent): string {
  const target = event.origin === 'unknown' ? '此页面' : event.origin
  return `${target} 请求${humanizePermission(event.permission)}，赛博包工头已拒绝。`
}

export function formatPopupNotice(event: BrowserPopupEvent): string {
  const target = event.origin === 'unknown' ? '某个网站' : event.origin
  if (event.action === 'opened-in-orca') {
    return `${target} 已在赛博包工头中打开新页面。`
  }
  if (event.action === 'opened-external') {
    return `${target} 已在默认浏览器中打开新窗口。`
  }
  return `${target} 尝试打开赛博包工头暂不支持的弹窗。`
}

export function formatDownloadFinishedNotice(event: BrowserDownloadFinishedEvent): string {
  if (event.status === 'completed') {
    return event.savePath ? `已下载到 ${event.savePath}。` : '下载完成。'
  }
  if (event.status === 'failed') {
    return event.error ?? '下载失败。'
  }
  return event.error ?? '下载已取消。'
}

export function formatByteCount(bytes: number | null): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) {
    return null
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

export function formatLoadFailureDescription(
  loadError: BrowserLoadErrorLike,
  meta: LoadFailureMeta
): string {
  if (!loadError) {
    return '页面没有响应。'
  }
  if (isChromiumCertificateErrorCode(loadError.code)) {
    const host = meta.host ?? '此地址'
    if (loadError.code === -200) {
      return translate(
        'browser.loadFailure.certificateNameMismatch',
        '证书与 {{value0}} 不匹配。',
        { value0: host }
      )
    }
    if (loadError.code === -201) {
      return translate(
        'browser.loadFailure.certificateDateInvalid',
        '{{value0}} 的证书在当前日期和时间无效。',
        { value0: host }
      )
    }
    if (loadError.code === -202) {
      return translate(
        'browser.loadFailure.certificateAuthorityInvalid',
        '赛博包工头不信任为 {{value0}} 颁发证书的机构。',
        { value0: host }
      )
    }
    return translate(
      'browser.loadFailure.certificateVerificationFailed',
      '赛博包工头无法验证 {{value0}} 的证书。',
      { value0: host }
    )
  }
  if (meta.isLocalhostLike) {
    return '无法连接到本地服务器。'
  }
  if (loadError.code === 0) {
    return loadError.description
  }
  return '无法连接到此页面。'
}

export function formatLoadFailureRecoveryHint(
  meta: LoadFailureMeta,
  loadError?: BrowserLoadErrorLike
): string | null {
  if (!meta.isLocalhostLike || (loadError && isChromiumCertificateErrorCode(loadError.code))) {
    return null
  }
  return '如果这是本地应用，请确认服务器正在运行并监听预期端口。'
}

export function isCertificateLoadError(loadError: BrowserLoadErrorLike): boolean {
  return Boolean(loadError && isChromiumCertificateErrorCode(loadError.code))
}
