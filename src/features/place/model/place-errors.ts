import { getApiErrorMessage, type ApiProblemMessages } from '@/shared/api'

const placeNotFoundMessages = {
  PLACE_NOT_FOUND: 'Место не найдено.',
} satisfies ApiProblemMessages

const placeSlugConflictMessages = {
  PLACE_SLUG_CONFLICT: 'Место с таким ярлыком уже существует.',
} satisfies ApiProblemMessages

const pinnedMaterialNotFoundMessages = {
  PINNED_MATERIAL_NOT_FOUND: 'Закрепленный материал не найден.',
} satisfies ApiProblemMessages

/** Возвращает безопасное сообщение об ошибке создания места. */
export function getCreatePlaceError(error: unknown) {
  return getApiErrorMessage(error, placeSlugConflictMessages)
}

/** Возвращает безопасное сообщение об ошибке редактирования места. */
export function getEditPlaceError(error: unknown) {
  return getApiErrorMessage(error, {
    ...placeSlugConflictMessages,
    ...placeNotFoundMessages,
  })
}

/** Возвращает безопасное сообщение об ошибке изменения статуса места. */
export function getPlaceStatusError(error: unknown) {
  return getApiErrorMessage(error, placeNotFoundMessages)
}

/** Возвращает безопасное API-сообщение об ошибке загрузки обложки места. */
export function getPlaceCoverUploadApiError(error: unknown) {
  return getApiErrorMessage(error, placeNotFoundMessages)
}

/** Возвращает безопасное сообщение об ошибке закрепления материала. */
export function getSetPinnedMaterialError(error: unknown) {
  return getApiErrorMessage(error, {
    ...pinnedMaterialNotFoundMessages,
    PINNED_MATERIAL_NOT_LINKED: 'Материал не связан с этим местом.',
    ...placeNotFoundMessages,
  })
}

/** Возвращает безопасное сообщение об ошибке снятия закрепления материала. */
export function getClearPinnedMaterialError(error: unknown) {
  return getApiErrorMessage(error, {
    ...pinnedMaterialNotFoundMessages,
    ...placeNotFoundMessages,
  })
}

/** Возвращает безопасное сообщение об ошибке запуска импорта места. */
export function getPlaceImportStartError(error: unknown) {
  return getApiErrorMessage(error, {
    PLACE_IMPORT_INPUT_INVALID: 'Проверьте ссылку для импорта.',
    PLACE_IMPORTS_UNAVAILABLE: 'Сервис импорта временно недоступен.',
  })
}

/** Возвращает безопасное сообщение об ошибке confirm/cancel импорта места. */
export function getPlaceImportActionError(error: unknown) {
  return getApiErrorMessage(error, {
    PLACE_IMPORT_PREVIEW_EXPIRED:
      'Срок действия preview истёк. Запустите импорт заново.',
    PLACE_IMPORT_PREVIEW_NOT_READY:
      'Preview ещё не готов. Дождитесь завершения обработки.',
  })
}

/** Возвращает безопасное сообщение об ошибке открытия CAPTCHA viewer. */
export function getCaptchaViewerError(error: unknown) {
  return getApiErrorMessage(error, {
    PLACE_IMPORT_VIEWER_UNAVAILABLE: 'Просмотр CAPTCHA временно недоступен.',
  })
}
