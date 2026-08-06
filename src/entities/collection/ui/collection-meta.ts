import type { AdminCollectionSummaryResponseDto } from '@/shared/api'

/** Форматирует краткие счётчики мест для таблицы подборок. */
export function getCollectionPlacesMeta(
  collection: Pick<
    AdminCollectionSummaryResponseDto,
    'activePlaceCount' | 'hiddenPlaceCount'
  >,
) {
  return `${collection.activePlaceCount} активных · ${collection.hiddenPlaceCount} скрытых`
}

/** Возвращает безопасное отображаемое описание подборки. */
export function getCollectionDescription(
  description: AdminCollectionSummaryResponseDto['description'],
) {
  return description?.trim() || 'Описание не задано'
}
