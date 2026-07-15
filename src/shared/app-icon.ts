export const APP_ICON_OPTIONS = [
  { id: 'classic', label: '赛博包工头经典图标' },
  { id: 'watercolor', label: '赛博包工头水彩图标' },
  { id: 'blue', label: '赛博包工头蓝色图标' }
] as const

export type AppIconId = (typeof APP_ICON_OPTIONS)[number]['id']

export const DEFAULT_APP_ICON_ID: AppIconId = 'classic'

export function normalizeAppIconId(value: unknown): AppIconId {
  return APP_ICON_OPTIONS.some((option) => option.id === value)
    ? (value as AppIconId)
    : DEFAULT_APP_ICON_ID
}
