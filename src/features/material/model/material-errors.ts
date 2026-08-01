import { getApiErrorMessage, type ApiProblemMessages } from '@/shared/api'

const materialNotFoundMessages = {
  MATERIAL_NOT_FOUND: 'Материал не найден.',
} satisfies ApiProblemMessages

/** Возвращает безопасное сообщение об ошибке создания материала места. */
export function getCreateMaterialError(error: unknown) {
  return getApiErrorMessage(error, {
    PLACE_NOT_FOUND: 'Место не найдено.',
  })
}

/** Возвращает безопасное сообщение об ошибке редактирования материала. */
export function getEditMaterialError(error: unknown) {
  return getApiErrorMessage(error, materialNotFoundMessages)
}

/** Возвращает безопасное сообщение об ошибке изменения admin-статуса материала. */
export function getMaterialAdminStatusError(error: unknown) {
  return getApiErrorMessage(error, materialNotFoundMessages)
}

/** Возвращает безопасное сообщение об ошибке привязки существующего материала. */
export function getLinkExistingMaterialError(error: unknown) {
  return getApiErrorMessage(error, {
    MATERIAL_PLACE_NOT_FOUND: 'Материал места не найден.',
    ...materialNotFoundMessages,
    PLACE_NOT_FOUND: 'Место не найдено.',
  })
}
