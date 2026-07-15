import { app } from 'electron'
import i18next, {
  type BackendModule,
  type i18n as I18nInstance,
  type ReadCallback,
  type TOptions
} from 'i18next'
import zh from '../../renderer/src/i18n/locales/zh.json'

import { isPseudoLocalizationLocale, pseudoLocalizeString } from '../../shared/pseudo-localization'
import { DEFAULT_UI_LOCALE, resolveUiLocale, type SupportedUiLocale } from '../../shared/ui-locale'
import { UI_LANGUAGE_SYSTEM, type UiLanguage } from '../../shared/ui-language'

export const mainI18n: I18nInstance = i18next.createInstance()

let initialized = false

// 中文目录在主进程冷启动时同步可用，其余语言仅在用户明确选择后按需加载。
const LAZY_LOCALE_LOADERS: Record<
  Exclude<SupportedUiLocale, 'zh'>,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  en: () => import('../../renderer/src/i18n/locales/en.json'),
  es: () => import('../../renderer/src/i18n/locales/es.json'),
  ja: () => import('../../renderer/src/i18n/locales/ja.json'),
  ko: () => import('../../renderer/src/i18n/locales/ko.json')
}

const lazyLocaleBackend: BackendModule = {
  type: 'backend',
  init: () => {},
  read: (language: string, _namespace: string, callback: ReadCallback) => {
    const loader = LAZY_LOCALE_LOADERS[language as Exclude<SupportedUiLocale, 'zh'>]
    if (!loader) {
      // 中文目录已同步加载；未知语言由 i18next 回退到默认中文。
      callback(null, false)
      return
    }
    loader().then(
      (mod) => callback(null, mod.default),
      (error) => callback(error instanceof Error ? error : new Error(String(error)), false)
    )
  }
}

export function getMainSystemLocale(): string {
  try {
    return app.getLocale()
  } catch {
    return DEFAULT_UI_LOCALE
  }
}

export async function ensureMainI18n(): Promise<I18nInstance> {
  if (!initialized) {
    await mainI18n.use(lazyLocaleBackend).init({
      fallbackLng: DEFAULT_UI_LOCALE,
      lng: DEFAULT_UI_LOCALE,
      // Main 菜单和系统对话框在首次绘制前就需要完整中文目录。
      partialBundledLanguages: true,
      resources: {
        zh: {
          translation: zh
        }
      },
      interpolation: {
        escapeValue: false
      }
    })
    initialized = true
  }
  return mainI18n
}

export async function setMainUiLanguage(language: UiLanguage): Promise<SupportedUiLocale> {
  await ensureMainI18n()
  const locale = resolveUiLocale(
    language,
    language === UI_LANGUAGE_SYSTEM ? getMainSystemLocale() : DEFAULT_UI_LOCALE
  )
  if (mainI18n.language !== locale) {
    // 等待目录加载完毕后再绘制菜单和系统对话框，避免语言切换时出现混合文案。
    await mainI18n.changeLanguage(locale)
  }
  return locale
}

export function translateMain(key: string, fallback: string, options?: TOptions): string {
  // 测试可能在异步初始化前注册菜单，此时回退文案比返回未定义值更稳定。
  const raw = initialized ? mainI18n.t(key, { defaultValue: fallback, ...options }) : fallback
  const value = typeof raw === 'string' && raw.length > 0 ? raw : fallback
  return isPseudoLocalizationLocale(mainI18n.language) ? pseudoLocalizeString(value) : value
}
