import type { PlaceCategory, PlaceStatus } from '@/shared/api/generated/model'
import type { TagProps } from 'antd'

/**
 * UI-метаданные места для отображения в Ant Design компонентах.
 */
export type PlaceMeta = {
  color: TagProps['color']
  label: string
}

const statusMeta = {
  active: {
    color: 'green',
    label: 'Опубликовано',
  },
  hidden: {
    color: 'default',
    label: 'Скрыто',
  },
} satisfies Record<PlaceStatus, PlaceMeta>

/**
 * Возвращает UI-метаданные для серверной категории места.
 */
export const getPlaceCategoryMeta = (category: PlaceCategory) =>
  ({
    color: 'default',
    label: category.title,
  }) satisfies PlaceMeta

/**
 * Возвращает локализованные UI-метаданные для backend-статуса места.
 */
export const getPlaceStatusMeta = (status: PlaceStatus) => statusMeta[status]

/**
 * Возвращает категории мест в формате options для Ant Design controls.
 */
export const getPlaceCategoryOptions = (categories: readonly PlaceCategory[]) =>
  categories.map((category) => ({
    label: getPlaceCategoryMeta(category).label,
    value: category.id,
  }))
