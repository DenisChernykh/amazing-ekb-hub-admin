import type {
  ContentSourceResponseDtoPlatform,
  ContentSourceResponseDtoStatus,
} from '@/shared/api'

/**
 * UI-метаданные content source для тегов, фильтров и таблиц.
 */
export type ContentSourceMeta = {
  color: string
  label: string
}

const contentSourcePlatformMeta: Record<
  ContentSourceResponseDtoPlatform,
  ContentSourceMeta
> = {
  dzen: {
    color: 'gold',
    label: 'Дзен',
  },
  instagram: {
    color: 'magenta',
    label: 'Instagram',
  },
  pinterest: {
    color: 'red',
    label: 'Pinterest',
  },
  telegram: {
    color: 'blue',
    label: 'Telegram',
  },
  tiktok: {
    color: 'purple',
    label: 'TikTok',
  },
  vk: {
    color: 'geekblue',
    label: 'VK',
  },
}

const contentSourceStatusMeta: Record<
  ContentSourceResponseDtoStatus,
  ContentSourceMeta
> = {
  active: {
    color: 'green',
    label: 'Активен',
  },
  disabled: {
    color: 'default',
    label: 'Отключен',
  },
}

/**
 * Runtime-значения платформ content source в стабильном UI-порядке.
 */
export const CONTENT_SOURCE_PLATFORM_VALUES = [
  'telegram',
  'dzen',
  'instagram',
  'tiktok',
  'vk',
  'pinterest',
] satisfies ContentSourceResponseDtoPlatform[]

/**
 * Runtime-значения статусов content source в стабильном UI-порядке.
 */
export const CONTENT_SOURCE_STATUS_VALUES = [
  'active',
  'disabled',
] satisfies ContentSourceResponseDtoStatus[]

/**
 * Возвращает локализованные UI-метаданные платформы content source.
 */
export function getContentSourcePlatformMeta(
  platform: ContentSourceResponseDtoPlatform,
) {
  return contentSourcePlatformMeta[platform]
}

/**
 * Возвращает локализованные UI-метаданные статуса content source.
 */
export function getContentSourceStatusMeta(
  status: ContentSourceResponseDtoStatus,
) {
  return contentSourceStatusMeta[status]
}

/**
 * Возвращает options платформ content source для Ant Design Select.
 */
export function getContentSourcePlatformOptions() {
  return CONTENT_SOURCE_PLATFORM_VALUES.map((platform) => ({
    label: getContentSourcePlatformMeta(platform).label,
    value: platform,
  }))
}

/**
 * Возвращает options статусов content source для Ant Design Select.
 */
export function getContentSourceStatusOptions() {
  return CONTENT_SOURCE_STATUS_VALUES.map((status) => ({
    label: getContentSourceStatusMeta(status).label,
    value: status,
  }))
}

/**
 * Форматирует nullable datetime content source без timezone-пересчета.
 *
 * @returns `—`, если значение отсутствует.
 */
export function formatContentSourceDateTime(value: string | null) {
  if (value === null) {
    return '—'
  }

  return value.slice(0, 16).replace('T', ' ')
}
