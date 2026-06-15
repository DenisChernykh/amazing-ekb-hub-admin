import type { MaterialType, Platform } from '@/shared/api/generated/model'

/**
 * UI-метаданные значения материала для тегов и таблиц.
 */
export type MaterialMeta = {
  color: string
  label: string
}

const materialPlatformMeta: Record<Platform, MaterialMeta> = {
  dzen: {
    color: 'gold',
    label: 'Дзен',
  },
  instagram: {
    color: 'magenta',
    label: 'Instagram',
  },
  telegram: {
    color: 'blue',
    label: 'Telegram',
  },
}

const materialTypeMeta: Record<MaterialType, MaterialMeta> = {
  post: {
    color: 'default',
    label: 'Пост',
  },
  reel: {
    color: 'purple',
    label: 'Reels',
  },
  video: {
    color: 'red',
    label: 'Видео',
  },
}

/**
 * Runtime-значения платформ материалов в стабильном UI-порядке.
 */
export const MATERIAL_PLATFORM_VALUES = [
  'telegram',
  'dzen',
  'instagram',
] satisfies Platform[]

/**
 * Runtime-значения типов материалов в стабильном UI-порядке.
 */
export const MATERIAL_TYPE_VALUES = [
  'post',
  'reel',
  'video',
] satisfies MaterialType[]

/**
 * Возвращает локализованные UI-метаданные платформы материала.
 */
export function getMaterialPlatformMeta(platform: Platform) {
  return materialPlatformMeta[platform]
}

/**
 * Возвращает локализованные UI-метаданные типа материала.
 */
export function getMaterialTypeMeta(type: MaterialType) {
  return materialTypeMeta[type]
}

/**
 * Возвращает options платформ материалов для Ant Design Select.
 */
export function getMaterialPlatformOptions() {
  return MATERIAL_PLATFORM_VALUES.map((platform) => ({
    label: getMaterialPlatformMeta(platform).label,
    value: platform,
  }))
}

/**
 * Возвращает options типов материалов для Ant Design Select.
 */
export function getMaterialTypeOptions() {
  return MATERIAL_TYPE_VALUES.map((type) => ({
    label: getMaterialTypeMeta(type).label,
    value: type,
  }))
}

/**
 * Форматирует длительность материала в `m:ss` или `h:mm:ss`.
 *
 * @returns `—`, если у материала нет длительности.
 */
export function formatMaterialDuration(durationSec: number | null) {
  if (durationSec === null) {
    return '—'
  }

  const seconds = durationSec % 60
  const totalMinutes = Math.floor(durationSec / 60)
  const minutes = totalMinutes % 60
  const hours = Math.floor(totalMinutes / 60)
  const paddedSeconds = seconds.toString().padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${paddedSeconds}`
  }

  return `${minutes}:${paddedSeconds}`
}

/**
 * Форматирует дату публикации материала без UTC-нормализации.
 *
 * @remarks Backend принимает ISO datetime со смещением, поэтому UI сохраняет календарный день из исходной строки и не вызывает `toISOString()`.
 */
export function formatMaterialPublishedDate(publishedAt: string) {
  return publishedAt.slice(0, 10)
}
