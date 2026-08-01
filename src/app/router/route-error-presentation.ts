import {
  getApiErrorPresentation,
  isProblemCode,
  type ApiErrorPresentation,
} from '@/shared/api'

/**
 * Преобразует route error в безопасное представление для общего error element.
 *
 * @remarks Использует общую API-классификацию, но даёт
 * `AUTHORIZATION_DENIED` контекст страницы, не раскрывая backend strings.
 *
 * @returns Локальное сообщение, retry policy и optional request ID.
 */
export function getRouteErrorPresentation(
  error: unknown,
): ApiErrorPresentation {
  if (isProblemCode(error, 'AUTHORIZATION_DENIED')) {
    return {
      message: 'Недостаточно прав для открытия страницы.',
      retryable: false,
    }
  }

  return getApiErrorPresentation(error)
}
