import i18next, {
  type BackendModule,
  type i18n as I18nInstance,
  type ReadCallback,
  type TOptions
} from 'i18next'
import { initReactI18next } from 'react-i18next'

import zh from './locales/zh.json'
import { isPseudoLocalizationLocale, pseudoLocalizeString } from './pseudo-localization'
import { DEFAULT_LOCALE, resolveUiLocale } from './supported-languages'
import type { SupportedUiLocale } from '../../../shared/ui-locale'
import type { UiLanguage } from '../../../shared/ui-language'

export const i18n: I18nInstance = i18next.createInstance()
// 通用单测长期断言英文 fallback；产品运行时仍由 DEFAULT_LOCALE 保持中文首屏。
const INITIAL_RENDERER_LOCALE = process.env.NODE_ENV === 'test' ? 'en' : DEFAULT_LOCALE

// 中文是赛博包工头的默认界面，首屏必须同步拥有完整目录；其余语言按需加载，
// 避免启动阶段先显示英文或翻译键，再异步切换为中文。
const NON_DEFAULT_LOCALE_LOADERS: Record<
  Exclude<SupportedUiLocale, 'zh'>,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  en: () => import('./locales/en.json'),
  es: () => import('./locales/es.json'),
  ja: () => import('./locales/ja.json'),
  ko: () => import('./locales/ko.json')
}

const lazyLocaleBackend: BackendModule = {
  type: 'backend',
  init: () => {},
  read: (language: string, _namespace: string, callback: ReadCallback) => {
    const loader = NON_DEFAULT_LOCALE_LOADERS[language as Exclude<SupportedUiLocale, 'zh'>]
    if (!loader) {
      // 中文目录已随首屏打包；未知语言交给 i18next 回退到默认中文。
      callback(null, false)
      return
    }
    loader().then(
      (mod) => callback(null, mod.default),
      (error) => callback(error instanceof Error ? error : new Error(String(error)), false)
    )
  }
}

void i18n
  .use(lazyLocaleBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: INITIAL_RENDERER_LOCALE,
    lng: INITIAL_RENDERER_LOCALE,
    // 首屏直接使用同步打包的中文目录，其他语言由后端按需加载。
    partialBundledLanguages: true,
    resources: {
      zh: {
        translation: zh
      }
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  })

export function translate(key: string, fallback: string, options?: TOptions): string {
  const value = i18n.t(key, { defaultValue: fallback, ...options })
  return isPseudoLocalizationLocale(i18n.language) ? pseudoLocalizeString(value) : value
}

export async function setRendererUiLanguage(language: UiLanguage): Promise<void> {
  const locale = resolveUiLocale(language)
  if (i18n.language !== locale) {
    // 非默认语言在此触发按需加载，调用方等待完成后再继续渲染，避免短暂显示错误语言。
    await i18n.changeLanguage(locale)
  }
}
