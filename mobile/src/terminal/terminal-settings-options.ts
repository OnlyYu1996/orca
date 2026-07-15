import type { PickerOption } from '../components/PickerModal'
import type { MobileMessageKey } from '../i18n/mobile-locales'

export type RestoreValue = 'indefinite' | '60s' | '5m' | '30m'
export type TextSizeValue = 'smallest' | 'smaller' | 'default' | 'large' | 'larger' | 'largest'

type Translate = (key: MobileMessageKey, parameters?: Record<string, string | number>) => string
export type TextSizeOption = PickerOption<TextSizeValue> & { scale: number }
export type RestoreOption = PickerOption<RestoreValue> & { ms: number | null }

export function getTerminalTextSizeOptions(t: Translate): TextSizeOption[] {
  return [
    { value: 'smallest', label: t('terminal.smallest'), scale: 0.5 },
    { value: 'smaller', label: t('terminal.smaller'), scale: 0.75 },
    { value: 'default', label: t('terminal.default'), scale: 1 },
    { value: 'large', label: t('terminal.large'), scale: 1.25 },
    { value: 'larger', label: t('terminal.larger'), scale: 1.5 },
    { value: 'largest', label: t('terminal.largest'), scale: 2 }
  ]
}

export function getTerminalRestoreOptions(t: Translate): RestoreOption[] {
  return [
    { value: 'indefinite', label: t('terminal.keepPhoneSize'), ms: null },
    { value: '60s', label: t('terminal.afterOneMinute'), ms: 60_000 },
    { value: '5m', label: t('terminal.afterFiveMinutes'), ms: 5 * 60_000 },
    { value: '30m', label: t('terminal.afterThirtyMinutes'), ms: 30 * 60_000 }
  ]
}

export function textSizeValueFromScale(scale: number, options: TextSizeOption[]): TextSizeValue {
  return options.find((option) => option.scale === scale)?.value ?? 'default'
}

export function terminalTextSizeSummary(scale: number, options: TextSizeOption[]): string {
  return (options.find((option) => option.scale === scale) ?? options[0]!).label
}

export function restoreValueFromMs(
  ms: number | null | undefined,
  options: RestoreOption[]
): RestoreValue {
  if (ms == null) {
    return 'indefinite'
  }
  const exact = options.find((option) => option.ms === ms)
  if (exact) {
    return exact.value
  }
  let closest: RestoreOption | null = null
  let bestDelta = Infinity
  for (const option of options) {
    if (option.ms == null) {
      continue
    }
    const delta = Math.abs(option.ms - ms)
    if (delta < bestDelta) {
      bestDelta = delta
      closest = option
    }
  }
  return closest?.value ?? 'indefinite'
}

export function terminalRestoreSummary(
  ms: number | null | undefined,
  options: RestoreOption[],
  t: Translate
): string {
  if (ms === undefined) {
    return '…'
  }
  if (ms === null) {
    return options[0]!.label
  }
  const exact = options.find((option) => option.ms === ms)
  return exact?.label ?? t('terminal.afterSeconds', { seconds: Math.round(ms / 1000) })
}
