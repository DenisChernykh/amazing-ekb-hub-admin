import type {
  AdminPlaceSummaryResponseDtoStatus,
  PlaceCategoryResponseDto,
} from '@/shared/api'
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
} satisfies Record<AdminPlaceSummaryResponseDtoStatus, PlaceMeta>

/**
 * Возвращает UI-метаданные для серверной категории места.
 */
export const getPlaceCategoryMeta = (category: PlaceCategoryResponseDto) =>
  ({
    color: 'default',
    label: category.title,
  }) satisfies PlaceMeta

/**
 * Возвращает локализованные UI-метаданные для backend-статуса места.
 */
export const getPlaceStatusMeta = (
  status: AdminPlaceSummaryResponseDtoStatus,
) => statusMeta[status]

/**
 * Возвращает категории мест в формате options для Ant Design controls.
 */
export const getPlaceCategoryOptions = (
  categories: readonly PlaceCategoryResponseDto[],
) =>
  categories.map((category) => ({
    label: getPlaceCategoryMeta(category).label,
    value: category.id,
  }))
