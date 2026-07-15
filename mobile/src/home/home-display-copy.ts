import type { ConnectionVerdict } from '../transport/connection-health'
import type { MobileLocale } from '../i18n/mobile-locale-context'
import type { MobileMessageKey } from '../i18n/mobile-locales'

type Translate = (key: MobileMessageKey, parameters?: Record<string, string | number>) => string

export function getHomeOnboardingSteps(t: Translate): Array<{ title: string; desc: string }> {
  return [
    { title: t('home.openDesktopTitle'), desc: t('home.openDesktopDescription') },
    { title: t('home.scanCodeTitle'), desc: t('home.scanCodeDescription') },
    { title: t('home.connectedTitle'), desc: t('home.connectedDescription') }
  ]
}

export function formatHomeDuration(ms: number, locale: MobileLocale): string {
  const totalMinutes = Math.floor(ms / 60_000)
  const totalHours = Math.floor(totalMinutes / 60)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0) {
    return locale === 'zh-CN' ? `${days}天 ${hours}小时` : `${days}d ${hours}h`
  }
  const minutes = totalMinutes % 60
  if (totalHours > 0) {
    return locale === 'zh-CN' ? `${totalHours}小时 ${minutes}分钟` : `${totalHours}h ${minutes}m`
  }
  return locale === 'zh-CN' ? `${totalMinutes}分钟` : `${totalMinutes}m`
}

export function getHomeConnectionLabel(verdict: ConnectionVerdict, t: Translate): string {
  let label: string
  if (verdict.kind === 'auth-failed') {
    label = t('home.authFailed')
  } else if (verdict.kind === 'warning') {
    label = t('home.cannotConnect')
  } else if (verdict.kind === 'unreachable') {
    label = t('home.cannotReachDesktop')
  } else {
    const labels = {
      Connected: t('home.connected'),
      'Connecting…': t('home.connecting'),
      Disconnected: t('home.disconnected'),
      'Reconnecting…': t('home.reconnecting')
    }
    label = labels[verdict.label as keyof typeof labels] ?? verdict.label
  }
  return (verdict.kind === 'warning' || verdict.kind === 'unreachable') && verdict.hint
    ? `${label} — ${t('home.checkTailscale')}`
    : label
}
