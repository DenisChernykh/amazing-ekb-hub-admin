import type { PlaceCategory, PlaceStatus } from '@/shared/api/generated/model'
import type { TagProps } from 'antd'

/**
 * UI-метаданные места для отображения в Ant Design компонентах.
 */
export type PlaceMeta = {
  color: TagProps['color']
  label: string
}

const categoryMeta = {
  cafe: {
    color: 'orange',
    label: 'Кафе',
  },
  hotels: {
    color: 'cyan',
    label: 'Отели',
  },
  pools: {
    color: 'blue',
    label: 'Бассейны',
  },
  spa: {
    color: 'purple',
    label: 'SPA',
  },
  workshops: {
    color: 'green',
    label: 'Мастерские',
  },
} satisfies Record<PlaceCategory, PlaceMeta>

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
 * Возвращает локализованные UI-метаданные для backend-категории места.
 */
export const getPlaceCategoryMeta = (category: PlaceCategory) =>
  categoryMeta[category]

/**
 * Возвращает локализованные UI-метаданные для backend-статуса места.
 */
export const getPlaceStatusMeta = (status: PlaceStatus) => statusMeta[status]
