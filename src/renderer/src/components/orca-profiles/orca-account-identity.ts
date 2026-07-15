import { translate } from '@/i18n/i18n'
import type { OrcaProfileAuthStatus, OrcaProfileSummary } from '../../../../shared/orca-profiles'

export function getOrcaAccountIdentity(
  profile: OrcaProfileSummary,
  authStatus: OrcaProfileAuthStatus | null
): { title: string; subtitle: string } {
  // 仅账户菜单不能把本地执行配置展示为已认证的赛博包工头身份。
  const cloud = authStatus?.cloud ?? profile.cloud
  if (authStatus?.state === 'connected') {
    return {
      title:
        cloud?.displayName?.trim() ||
        cloud?.email ||
        translate('auto.components.orca.profiles.switcher.accountTitle', '赛博包工头账户'),
      subtitle:
        cloud?.activeOrgName ||
        (cloud?.displayName && cloud.email
          ? cloud.email
          : translate('auto.components.orca.profiles.switcher.accountSignedIn', 'Signed in'))
    }
  }
  if (authStatus?.state === 'reconnect-required') {
    return {
      title:
        cloud?.displayName?.trim() ||
        cloud?.email ||
        translate('auto.components.orca.profiles.switcher.accountTitle', '赛博包工头账户'),
      subtitle: translate(
        'auto.components.orca.profiles.switcher.accountSignInRequired',
        'Sign-in required'
      )
    }
  }
  return {
    title: translate('auto.components.orca.profiles.switcher.accountTitle', '赛博包工头账户'),
    subtitle: translate('auto.components.orca.profiles.switcher.accountSignedOut', 'Signed out')
  }
}
