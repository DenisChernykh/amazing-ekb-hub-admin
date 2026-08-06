import { getApiErrorMessage, type ApiProblemMessages } from '@/shared/api'

const commonMessages = {
  COLLECTION_NOT_FOUND: 'Подборка не найдена.',
  COLLECTION_SLUG_CONFLICT: 'Подборка с таким ярлыком уже существует.',
} satisfies ApiProblemMessages

/** Переводит ошибки формы коллекции в безопасные сообщения. */
export function getCollectionFormError(error: unknown) {
  return getApiErrorMessage(error, commonMessages)
}

/** Переводит ошибки публикации коллекции. */
export function getCollectionStatusError(error: unknown) {
  return getApiErrorMessage(error, {
    ...commonMessages,
    COLLECTION_HAS_ACTIVE_IMPORT:
      'Нельзя изменить подборку во время активного импорта.',
    COLLECTION_PUBLISH_REQUIRES_ACTIVE_PLACE:
      'Опубликовать подборку можно только с активным местом.',
  })
}

/** Переводит конфликт удаления коллекции. */
export function getCollectionDeleteError(error: unknown) {
  return getApiErrorMessage(error, {
    ...commonMessages,
    COLLECTION_HAS_ACTIVE_IMPORT:
      'Подборку нельзя удалить во время активного импорта.',
  })
}
