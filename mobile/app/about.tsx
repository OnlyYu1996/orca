import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, GitFork, PackageOpen } from 'lucide-react-native'
import Constants from 'expo-constants'
import { OrcaLogo } from '../src/components/OrcaLogo'
import { colors, spacing, typography } from '../src/theme/mobile-theme'
import { useMobileLocale } from '../src/i18n/mobile-locale-context'
import {
  PRODUCT_RELEASES_URL,
  PRODUCT_REPOSITORY_SLUG,
  PRODUCT_REPOSITORY_URL
} from '../../src/shared/product-links'

// Why: read version + native build identifier from expo-constants at
// runtime so the About screen never drifts out of sync with app.json.
// nativeBuildVersion is iOS buildNumber on iOS and versionCode on
// Android — different concepts, same role (monotonic native build id).
function getVersionLabel(): string {
  const version = Constants.expoConfig?.version ?? '?.?.?'
  const build =
    Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber
      : String(Constants.expoConfig?.android?.versionCode ?? '')
  return build ? `v${version} (${build})` : `v${version}`
}

export default function AboutScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { t } = useMobileLocale()

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.heading}>{t('about.title')}</Text>
      </View>

      <View style={styles.brand}>
        <OrcaLogo size={28} />
        <Text style={styles.brandName}>{t('about.productName')}</Text>
        <Text style={styles.brandSub}>{t('about.tagline')}</Text>
      </View>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => void Linking.openURL(PRODUCT_REPOSITORY_URL)}
        >
          <GitFork size={16} color={colors.textSecondary} />
          <Text style={styles.rowLabel}>{t('about.repository')}</Text>
          <Text style={styles.rowValue}>{PRODUCT_REPOSITORY_SLUG}</Text>
        </Pressable>
        <View style={styles.separator} />
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => void Linking.openURL(PRODUCT_RELEASES_URL)}
        >
          <PackageOpen size={16} color={colors.textSecondary} />
          <Text style={styles.rowLabel}>{t('about.releases')}</Text>
        </Pressable>
      </View>

      <Text style={styles.versionText}>{getVersionLabel()}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    padding: spacing.lg
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl
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
  brand: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.sm
  },
  brandSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  section: {
    backgroundColor: colors.bgPanel,
    borderRadius: 12,
    overflow: 'hidden'
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
  rowLabel: {
    flex: 1,
    fontSize: typography.bodySize,
    fontWeight: '500',
    color: colors.textPrimary
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: typography.bodySize,
    color: colors.textSecondary
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: spacing.md
  },
  versionText: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: typography.metaSize,
    color: colors.textMuted
  }
})
