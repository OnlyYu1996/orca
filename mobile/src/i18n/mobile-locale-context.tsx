import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { enMessages, type MobileMessageKey, zhCNMessages } from './mobile-locales'

export type MobileLocale = 'zh-CN' | 'en'

type TranslationParameters = Record<string, string | number>

type MobileLocaleContextValue = {
  locale: MobileLocale
  setLocale: (locale: MobileLocale) => void
  t: (key: MobileMessageKey, parameters?: TranslationParameters) => string
}

const LANGUAGE_STORAGE_KEY = 'sbbgt:ui-language'
const LEGACY_LANGUAGE_STORAGE_KEY = 'orca:ui-language'
const MobileLocaleContext = createContext<MobileLocaleContextValue | null>(null)

function normalizeLocale(value: string | null): MobileLocale | null {
  if (value === 'zh' || value === 'zh-CN') {
    return 'zh-CN'
  }
  return value === 'en' ? 'en' : null
}

function renderMessage(message: string, parameters?: TranslationParameters): string {
  if (!parameters) {
    return message
  }
  return message.replace(/{{(\w+)}}/g, (placeholder, key: string) => {
    const value = parameters[key]
    return value == null ? placeholder : String(value)
  })
}

export function MobileLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, updateLocale] = useState<MobileLocale>('zh-CN')

  useEffect(() => {
    let active = true
    void Promise.all([
      AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY)
    ]).then(([current, legacy]) => {
      if (!active) {
        return
      }
      const storedLocale = normalizeLocale(current) ?? normalizeLocale(legacy)
      if (storedLocale) {
        updateLocale(storedLocale)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const setLocale = useCallback((nextLocale: MobileLocale) => {
    updateLocale(nextLocale)
    // 新版只写入 sbbgt 键，旧键仅用于兼容读取。
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale)
  }, [])

  const t = useCallback(
    (key: MobileMessageKey, parameters?: TranslationParameters) => {
      const message = locale === 'zh-CN' ? zhCNMessages[key] : enMessages[key]
      return renderMessage(message ?? enMessages[key], parameters)
    },
    [locale]
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <MobileLocaleContext.Provider value={value}>{children}</MobileLocaleContext.Provider>
}

export function useMobileLocale(): MobileLocaleContextValue {
  const context = useContext(MobileLocaleContext)
  if (!context) {
    throw new Error('useMobileLocale 必须在 MobileLocaleProvider 内使用')
  }
  return context
}
