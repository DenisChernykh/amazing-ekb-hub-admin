import type {
  AdminMaterialLibraryItem,
  MaterialAdminStatus,
  MaterialType,
  Platform,
  PublicMaterial,
} from '@/shared/api/generated/model'
import { isSafeMaterialUrl } from '../model/material-url'

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

const materialAdminStatusMeta: Record<MaterialAdminStatus, MaterialMeta> = {
  approved: {
    color: 'green',
    label: 'Одобрено',
  },
  archived: {
    color: 'default',
    label: 'Архив',
  },
  pending: {
    color: 'gold',
    label: 'На проверке',
  },
  rejected: {
    color: 'red',
    label: 'Отклонено',
  },
}

const materialLinkedMeta: Record<'linked' | 'unlinked', MaterialMeta> = {
  linked: {
    color: 'green',
    label: 'Связан',
  },
  unlinked: {
    color: 'default',
    label: 'Не связан',
  },
}

const materialMediaKindLabel: Record<string, string> = {
  album: 'Альбом',
  document: 'Документ',
  photo: 'Фото',
  video: 'Видео',
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
 * Runtime-значения review-статусов материалов в стабильном UI-порядке.
 */
export const MATERIAL_ADMIN_STATUS_VALUES = [
  'pending',
  'approved',
  'rejected',
  'archived',
] satisfies MaterialAdminStatus[]

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
 * Возвращает локализованные UI-метаданные review-статуса материала.
 */
export function getMaterialAdminStatusMeta(status: MaterialAdminStatus) {
  return materialAdminStatusMeta[status]
}

/**
 * Возвращает локализованные UI-метаданные наличия связи материала с местом.
 */
export function getMaterialLinkedMeta(linked: boolean) {
  return materialLinkedMeta[linked ? 'linked' : 'unlinked']
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
 * Возвращает options review-статусов материалов для Ant Design Select.
 */
export function getMaterialAdminStatusOptions() {
  return MATERIAL_ADMIN_STATUS_VALUES.map((status) => ({
    label: getMaterialAdminStatusMeta(status).label,
    value: status,
  }))
}

/**
 * Форматирует nullable media kind импортированного материала.
 *
 * @returns `—`, если importer не вернул тип media.
 */
export function formatMaterialMediaKind(mediaKind: string | null) {
  if (mediaKind === null) {
    return '—'
  }

  return materialMediaKindLabel[mediaKind] ?? mediaKind
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

/**
 * Возвращает preview-текст библиотечного материала для таблиц и selector-ов.
 *
 * @returns `—`, если backend не вернул ни excerpt, ни title, ни text.
 */
export function getMaterialLibraryPreviewText(
  material: AdminMaterialLibraryItem,
) {
  return material.excerpt ?? material.title ?? material.text ?? '—'
}

/**
 * Возвращает display title публичного материала для admin UI.
 *
 * @returns Заголовок материала или fallback для импортированных материалов без title.
 */
export function getPublicMaterialTitleText(
  material: Pick<PublicMaterial, 'title'>,
) {
  return material.title ?? 'Материал без названия'
}

/**
 * Возвращает название source библиотечного материала.
 *
 * @returns `Ручной материал` для материалов без content source.
 */
export function getMaterialLibrarySourceTitle(
  material: AdminMaterialLibraryItem,
) {
  return material.source?.displayName ?? 'Ручной материал'
}

/**
 * Возвращает безопасный href для material UI-ссылок.
 *
 * @returns `null`, если URL пустой или использует неподдерживаемый протокол.
 */
export function getSafeMaterialHref(url: string | null | undefined) {
  if (!url || !isSafeMaterialUrl(url)) {
    return null
  }

  return url
}
