import type { PlaceCategory } from '@/shared/api/generated/model'

/**
 * Поддерживаемые backend-категории мест в стабильном порядке для UI controls.
 */
export const PLACE_CATEGORY_VALUES = [
  'pools',
  'spa',
  'cafe',
  'hotels',
  'workshops',
] as const satisfies readonly PlaceCategory[]
