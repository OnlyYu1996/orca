import type { MobileConnectionPath } from './stable-logical-rpc-client'
import type { MobileLocale } from '../i18n/mobile-locale-context'

export function mobileConnectionPathLabel(
  path: MobileConnectionPath,
  locale: MobileLocale
): string {
  if (path === 'relay') {
    return locale === 'zh-CN' ? '赛博包工头 Relay' : 'Cyber Foreman Relay'
  }
  if (path === 'tailscale') {
    return locale === 'zh-CN' ? '直连 · Tailscale' : 'Direct · Tailscale'
  }
  return locale === 'zh-CN' ? '直连 · 局域网' : 'Direct · LAN'
}
