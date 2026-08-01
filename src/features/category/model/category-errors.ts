import { getApiErrorMessage, type ApiProblemMessages } from '@/shared/api'

const categorySlugConflictMessages = {
  CATEGORY_SLUG_CONFLICT: 'Категория с таким ярлыком уже существует.',
} satisfies ApiProblemMessages

const categoryNotFoundMessages = {
  CATEGORY_NOT_FOUND: 'Категория не найдена.',
} satisfies ApiProblemMessages

/** Возвращает безопасное сообщение об ошибке создания категории. */
export function getCreateCategoryError(error: unknown) {
  return getApiErrorMessage(error, categorySlugConflictMessages)
}

/** Возвращает безопасное сообщение об ошибке редактирования категории. */
export function getEditCategoryError(error: unknown) {
  return getApiErrorMessage(error, {
    ...categorySlugConflictMessages,
    ...categoryNotFoundMessages,
  })
}

/** Возвращает безопасное сообщение об ошибке удаления категории. */
export function getDeleteCategoryError(error: unknown) {
  return getApiErrorMessage(error, {
    CATEGORY_IN_USE: 'Категория используется местами и не может быть удалена.',
    ...categoryNotFoundMessages,
  })
}
