import { getApiErrorMessage, type ApiProblemMessages } from '@/shared/api'

const contentSourceNotFoundMessages = {
  CONTENT_SOURCE_NOT_FOUND: 'Источник не найден.',
} satisfies ApiProblemMessages

/** Возвращает безопасное сообщение об ошибке создания источника. */
export function getCreateContentSourceError(error: unknown) {
  return getApiErrorMessage(error, {
    CONTENT_SOURCE_ALREADY_EXISTS: 'Такой источник уже существует.',
  })
}

/** Возвращает безопасное сообщение об ошибке редактирования источника. */
export function getEditContentSourceError(error: unknown) {
  return getApiErrorMessage(error, {
    CONTENT_SOURCE_IDENTITY_LOCKED:
      'Идентификаторы источника нельзя изменить после создания.',
    ...contentSourceNotFoundMessages,
  })
}

/** Возвращает безопасное сообщение об ошибке изменения статуса источника. */
export function getContentSourceStatusError(error: unknown) {
  return getApiErrorMessage(error, contentSourceNotFoundMessages)
}

/** Возвращает безопасное сообщение об ошибке запуска Telegram-импорта. */
export function getImportTelegramSourceError(error: unknown) {
  return getApiErrorMessage(error, {
    ACTIVE_IMPORT_EXISTS: 'Импорт уже выполняется. Обновляем статус.',
    TELEGRAM_IMPORT_SOURCE_INVALID:
      'Источник не подходит для импорта Telegram.',
    TELEGRAM_IMPORT_UNAVAILABLE: 'Импорт Telegram временно недоступен.',
    ...contentSourceNotFoundMessages,
  })
}
