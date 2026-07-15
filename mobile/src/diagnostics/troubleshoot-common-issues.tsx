import { WifiOff, Shield, Monitor, Clock, Globe } from 'lucide-react-native'
import { colors } from '../theme/mobile-theme'
import type { MobileMessageKey } from '../i18n/mobile-locales'

export type TroubleshootSection = {
  id: string
  icon: React.ReactNode
  title: string
  steps: string[]
}

type Translate = (key: MobileMessageKey) => string

export function getTroubleshootCommonIssues(t: Translate): TroubleshootSection[] {
  return [
    {
      id: 'wifi',
      icon: <WifiOff size={16} color={colors.textSecondary} />,
      title: t('troubleshoot.wifiTitle'),
      steps: [t('troubleshoot.wifiStep1'), t('troubleshoot.wifiStep2'), t('troubleshoot.wifiStep3')]
    },
    {
      id: 'firewall',
      icon: <Shield size={16} color={colors.textSecondary} />,
      title: t('troubleshoot.firewallTitle'),
      steps: [
        t('troubleshoot.firewallMac'),
        t('troubleshoot.firewallWindows'),
        t('troubleshoot.firewallLinux'),
        t('troubleshoot.firewallNetwork')
      ]
    },
    {
      id: 'desktop',
      icon: <Monitor size={16} color={colors.textSecondary} />,
      title: t('troubleshoot.desktopTitle'),
      steps: [
        t('troubleshoot.desktopStep1'),
        t('troubleshoot.desktopStep2'),
        t('troubleshoot.desktopStep3')
      ]
    },
    {
      id: 'timeout',
      icon: <Clock size={16} color={colors.textSecondary} />,
      title: t('troubleshoot.timeoutTitle'),
      steps: [
        t('troubleshoot.timeoutStep1'),
        t('troubleshoot.timeoutStep2'),
        t('troubleshoot.timeoutStep3')
      ]
    },
    {
      id: 'tailscale',
      icon: <Globe size={16} color={colors.textSecondary} />,
      title: t('troubleshoot.tailscaleTitle'),
      steps: [
        t('troubleshoot.tailscaleStep1'),
        t('troubleshoot.tailscaleStep2'),
        t('troubleshoot.tailscaleStep3'),
        t('troubleshoot.tailscaleStep4')
      ]
    },
    {
      id: 'vpn',
      icon: <Shield size={16} color={colors.textSecondary} />,
      title: t('troubleshoot.vpnTitle'),
      steps: [t('troubleshoot.vpnStep1'), t('troubleshoot.vpnStep2')]
    }
  ]
}
