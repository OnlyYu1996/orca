import { Check, ChevronLeft } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { type MobileLocale, useMobileLocale } from '../src/i18n/mobile-locale-context'
import { colors, spacing, typography } from '../src/theme/mobile-theme'

const LANGUAGE_OPTIONS: Array<{ locale: MobileLocale; labelKey: 'language.zhCN' | 'language.en' }> =
  [
    { locale: 'zh-CN', labelKey: 'language.zhCN' },
    { locale: 'en', labelKey: 'language.en' }
  ]

export default function LanguageSettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { locale, setLocale, t } = useMobileLocale()

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.heading}>{t('language.title')}</Text>
      </View>

      <Text style={styles.description}>{t('language.description')}</Text>
      <View style={styles.section}>
        {LANGUAGE_OPTIONS.map((option, index) => {
          const selected = locale === option.locale
          return (
            <View key={option.locale}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => setLocale(option.locale)}
              >
                <Text style={styles.rowLabel}>{t(option.labelKey)}</Text>
                {selected ? <Check size={18} color={colors.statusGreen} /> : null}
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.lg
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary
  },
  description: {
    fontSize: typography.bodySize,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  section: {
    backgroundColor: colors.bgPanel,
    borderRadius: 12,
    overflow: 'hidden'
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2
  },
  rowPressed: {
    backgroundColor: colors.bgRaised
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.bodySize,
    fontWeight: '500',
    color: colors.textPrimary
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: spacing.md
  }
})
