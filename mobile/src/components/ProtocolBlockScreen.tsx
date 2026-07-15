import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { colors, radii, spacing, typography } from '../theme/mobile-theme'
import type { CompatVerdict } from '../transport/protocol-compat'
import { PRODUCT_RELEASES_URL } from '../../../src/shared/product-links'
import { useMobileLocale } from '../i18n/mobile-locale-context'

type Props = {
  verdict: Extract<CompatVerdict, { kind: 'blocked' }>
}

export function ProtocolBlockScreen({ verdict }: Props) {
  const { t } = useMobileLocale()
  const isMobileTooOld = verdict.reason === 'mobile-too-old'
  const title = isMobileTooOld ? t('protocol.updateMobileTitle') : t('protocol.updateDesktopTitle')
  const body = isMobileTooOld ? t('protocol.updateMobileBody') : t('protocol.updateDesktopBody')

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={() => {
            void Linking.openURL(PRODUCT_RELEASES_URL)
          }}
        >
          <Text style={styles.primaryButtonText}>{t('protocol.openReleases')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          onPress={() => {
            // Why: route back to the host list so the user can pair a
            // different host instead of getting trapped on this screen.
            router.replace('/')
          }}
        >
          <Text style={styles.secondaryButtonText}>{t('protocol.backToHosts')}</Text>
        </Pressable>
        <Text style={styles.recoveryNote}>{t('protocol.recovery')}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg
  },
  card: {
    backgroundColor: colors.bgPanel,
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  title: {
    fontSize: typography.titleSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  body: {
    fontSize: typography.bodySize,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  primaryButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.button,
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  primaryButtonText: {
    fontSize: typography.bodySize,
    fontWeight: '600',
    color: colors.bgBase
  },
  secondaryButton: {
    backgroundColor: colors.bgRaised,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.button,
    alignItems: 'center'
  },
  secondaryButtonText: {
    fontSize: typography.bodySize,
    fontWeight: '600',
    color: colors.textPrimary
  },
  recoveryNote: {
    fontSize: typography.metaSize,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: spacing.md
  },
  pressed: {
    opacity: 0.7
  }
})
