import { translate } from '@/i18n/i18n'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'
import { getRendererAppPlatform } from '@/lib/renderer-app-platform'
import { isWebClientLocation } from '@/lib/web-client-location'
import type { SettingsSearchEntry } from './settings-search'
import { translateSearchKeyword } from './settings-search-keywords'

const getSystemTrayEntryCatalog = createLocalizedCatalog((): SettingsSearchEntry[] => [
  {
    title: translate(
      'auto.components.settings.appearance.search.9a115966d3',
      'Minimize to Tray on Close'
    ),
    description: translate(
      'auto.components.settings.appearance.search.4d5b9427b5',
      '启用后，关闭窗口会让赛博包工头继续在系统托盘中运行，而不是退出。'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.appearance.search.tray.tray', 'tray', {
        englishOnly: true
      }),
      ...translateSearchKeyword(
        'auto.components.settings.appearance.search.tray.system',
        'system tray',
        { englishOnly: true }
      ),
      ...translateSearchKeyword(
        'auto.components.settings.appearance.search.tray.minimize',
        'minimize',
        { englishOnly: true }
      ),
      ...translateSearchKeyword('auto.components.settings.appearance.search.tray.close', 'close', {
        englishOnly: true
      }),
      ...translateSearchKeyword('auto.components.settings.appearance.search.e5bc35d59e', 'window'),
      ...translateSearchKeyword(
        'auto.components.settings.appearance.search.tray.notification',
        'notification area',
        { englishOnly: true }
      ),
      ...translateSearchKeyword(
        'auto.components.settings.appearance.search.tray.background',
        'background',
        { englishOnly: true }
      )
    ]
  }
])

const getMenuBarIconEntryCatalog = createLocalizedCatalog((): SettingsSearchEntry[] => [
  {
    title: translate('settings.appearance.menuBarIcon.title', 'Show Menu Bar Icon'),
    description: translate(
      'settings.appearance.menuBarIcon.description',
      '在 macOS 菜单栏中保留赛博包工头快捷方式和活动指示器。'
    ),
    keywords: [
      ...translateSearchKeyword('settings.appearance.menuBarIcon.keyword.menuBar', 'menu bar', {
        englishOnly: true
      }),
      ...translateSearchKeyword('auto.components.settings.appearance.search.tray.tray', 'tray', {
        englishOnly: true
      }),
      ...translateSearchKeyword('auto.components.settings.appearance.search.1f2880a9d5', 'sbbgt'),
      ...translateSearchKeyword(
        'settings.appearance.menuBarIcon.keyword.statusItem',
        'status item',
        { englishOnly: true }
      ),
      ...translateSearchKeyword('settings.appearance.menuBarIcon.keyword.activity', 'activity', {
        englishOnly: true
      }),
      ...translateSearchKeyword(
        'auto.components.settings.appearance.search.tray.background',
        'background',
        { englishOnly: true }
      )
    ]
  }
])

type SystemPresenceSearchOptions = {
  showMenuBarIcon?: boolean
  showSystemTray?: boolean
}

export function getSystemTrayEntries(
  options: SystemPresenceSearchOptions = {}
): SettingsSearchEntry[] {
  const show =
    options.showSystemTray ??
    // Why: a Windows web client can report win32, but it has no local tray.
    (getRendererAppPlatform() === 'win32' && !isWebClientLocation())
  return show ? getSystemTrayEntryCatalog() : []
}

export function getMenuBarIconEntries(
  options: SystemPresenceSearchOptions = {}
): SettingsSearchEntry[] {
  const show =
    options.showMenuBarIcon ?? (getRendererAppPlatform() === 'darwin' && !isWebClientLocation())
  return show ? getMenuBarIconEntryCatalog() : []
}
