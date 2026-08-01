import { getApiErrorMessage } from '@/shared/api'

/** Возвращает безопасное сообщение об ошибке скрытия связи материала с местом. */
export function getHidePlaceMaterialLinkError(error: unknown) {
  return getApiErrorMessage(error, {
    PLACE_MATERIAL_LINK_NOT_FOUND: 'Связь материала с местом не найдена.',
    MATERIAL_PLACE_NOT_FOUND: 'Материал места не найден.',
  })
}

/** Возвращает безопасное сообщение об ошибке загрузки материалов места. */
export function getPlaceMaterialsQueryError(error: unknown) {
  return getApiErrorMessage(error, {
    MATERIAL_PLACE_NOT_FOUND: 'Материал места не найден.',
  })
}
