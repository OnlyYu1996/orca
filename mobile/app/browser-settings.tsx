import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight, Globe } from 'lucide-react-native'
import { PickerModal, type PickerOption } from '../src/components/PickerModal'
import {
  loadTerminalLinkOpenMode,
  saveTerminalLinkOpenMode,
  type MobileTerminalLinkOpenMode
} from '../src/storage/preferences'
import { colors, radii, spacing, typography } from '../src/theme/mobile-theme'
import { useMobileLocale } from '../src/i18n/mobile-locale-context'

export default function BrowserSettingsScreen(): React.JSX.Element {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { t } = useMobileLocale()
  const [linkMode, setLinkMode] = useState<MobileTerminalLinkOpenMode>('orca-browser')
  const [pickerOpen, setPickerOpen] = useState(false)
  const linkModeOptions: PickerOption<MobileTerminalLinkOpenMode>[] = [
    {
      value: 'orca-browser',
      label: t('browser.desktopBrowser'),
      subtitle: t('browser.desktopBrowserDescription')
    },
    {
      value: 'phone-browser',
      label: t('browser.phoneBrowser'),
      subtitle: t('browser.phoneBrowserDescription')
    }
  ]
  const selectedLinkModeLabel =
    linkModeOptions.find((option) => option.value === linkMode)?.label ?? linkModeOptions[0]!.label

  useEffect(() => {
    void loadTerminalLinkOpenMode().then(setLinkMode)
  }, [])

  const selectLinkMode = useCallback((mode: MobileTerminalLinkOpenMode) => {
    setLinkMode(mode)
    void saveTerminalLinkOpenMode(mode)
  }, [])

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.heading}>{t('browser.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.groupHeading}>{t('browser.linksHeading')}</Text>
        <Text style={styles.groupDescription}>{t('browser.linksDescription')}</Text>
        <View style={[styles.section, styles.sectionTopGap]}>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => setPickerOpen(true)}
          >
            <Globe size={16} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{t('browser.openTerminalLinks')}</Text>
              <Text style={styles.rowSublabel}>{selectedLinkModeLabel}</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>

      <PickerModal<MobileTerminalLinkOpenMode>
        visible={pickerOpen}
        title={t('browser.openTerminalLinks')}
        options={linkModeOptions}
        selected={linkMode}
        onSelect={selectLinkMode}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.lg,
    paddingTop: 0
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
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
  scrollContent: {
    paddingBottom: spacing.xl
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs
  },
  groupDescription: {
    fontSize: typography.bodySize - 1,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: spacing.xs
  },
  section: {
    backgroundColor: colors.bgPanel,
    borderRadius: radii.card,
    overflow: 'hidden'
  },
  sectionTopGap: {
    marginTop: spacing.sm
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2
  },
  rowPressed: {
    backgroundColor: colors.bgRaised
  },
  rowContent: {
    flex: 1
  },
  rowLabel: {
    fontSize: typography.bodySize,
    fontWeight: '500',
    color: colors.textPrimary
  },
  rowSublabel: {
    fontSize: typography.bodySize - 2,
    color: colors.textSecondary,
    marginTop: 2
  }
})
