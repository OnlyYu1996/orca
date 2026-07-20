import { SearchableSetting } from './SearchableSetting'
import { SettingsSwitchRow } from './SettingsFormControls'
import { MobilePane } from './MobilePane'
import {
  getMobileOverviewSearchEntry,
  getMobileSidebarShortcutSearchEntry,
  getMobileSettingsPaneSearchEntries
} from './mobile-settings-search'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import { MobileRelayBetaNotice } from './MobileRelayBetaNotice'
import { PRODUCT_RELEASES_URL } from '../../../../shared/product-links'
export { getMobileSettingsPaneSearchEntries }

export function MobileSettingsPane(): React.JSX.Element {
  const showMobileButton = useAppStore((s) => s.settings?.showMobileButton !== false)
  const updateSettings = useAppStore((s) => s.updateSettings)

  return (
    <div className="space-y-4">
      <SearchableSetting
        title={translate('auto.components.settings.MobileSettingsPane.e7a3ae8c4e', 'Mobile')}
        description={translate(
          'auto.components.settings.MobileSettingsPane.174f4a3c6d',
          'Control terminals and agents from your phone.'
        )}
        keywords={getMobileOverviewSearchEntry().keywords}
        className="space-y-3 py-2"
      >
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            {translate(
              'auto.components.settings.MobileSettingsPane.installIntro',
              '从当前仓库下载赛博包工头移动端：'
            )}{' '}
            <button
              type="button"
              onClick={() => void window.api.shell.openUrl(PRODUCT_RELEASES_URL)}
              className="cursor-pointer underline underline-offset-2 hover:text-foreground"
            >
              {translate(
                'auto.components.settings.MobileSettingsPane.androidApkLabel',
                '项目 Releases'
              )}
            </button>
            {translate(
              'auto.components.settings.MobileSettingsPane.installOutro',
              ', then pair below.'
            )}
          </p>
          <MobileRelayBetaNotice />
        </div>
      </SearchableSetting>

      <SearchableSetting
        title={translate(
          'auto.components.settings.MobileSettingsPane.1de96ec8a6',
          '显示赛博包工头移动端按钮'
        )}
        description={translate(
          'auto.components.settings.MobileSettingsPane.682293cadf',
          '在左侧边栏顶部显示赛博包工头移动端按钮。'
        )}
        keywords={getMobileSidebarShortcutSearchEntry().keywords}
      >
        {/* Why: the in-page removal toast points users to Settings > Mobile. */}
        <SettingsSwitchRow
          label={translate(
            'auto.components.settings.MobileSettingsPane.1de96ec8a6',
            '显示赛博包工头移动端按钮'
          )}
          description={translate(
            'auto.components.settings.MobileSettingsPane.d4f2b65f30',
            '在侧边栏显示赛博包工头移动端快捷入口。'
          )}
          checked={showMobileButton}
          onChange={() => updateSettings({ showMobileButton: !showMobileButton })}
        />
      </SearchableSetting>

      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <MobilePane />
      </div>
    </div>
  )
}
