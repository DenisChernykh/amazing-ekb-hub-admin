import type { AdminPlaceSummaryResponseDto } from '@/shared/api'

/** Возвращает server-confirmed IDs коллекций для одной строки Place. */
export function getPlaceCollectionIds(
  place: Pick<AdminPlaceSummaryResponseDto, 'collections'>,
) {
  return place.collections.map(({ id }) => id)
}

/** Сравнивает full-set selection без зависимости от визуального порядка. */
export function areCollectionIdsEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((id) => right.includes(id))
}
