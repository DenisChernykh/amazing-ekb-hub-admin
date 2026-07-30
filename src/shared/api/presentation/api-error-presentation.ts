import {
  ApiNetworkError,
  ApiProblemError,
  ApiProtocolError,
} from '@/shared/api/client/api-errors'

/** Безопасное локализованное представление API-ошибки для UI. */
export type ApiErrorPresentation = {
  message: string
  requestId?: string
  retryable: boolean
}

/**
 * Преобразует typed API error в безопасное локализованное представление.
 *
 * @remarks Никогда не переносит в UI backend `title`, `detail` или field
 * `detail`. Диагностический `requestId` показывает только для server problems.
 *
 * @returns Локальное сообщение, признак допустимого retry и optional request ID.
 */
export function getApiErrorPresentation(error: unknown): ApiErrorPresentation {
  if (error instanceof ApiNetworkError) {
    return {
      message: 'Не удалось подключиться к серверу.',
      retryable: true,
    }
  }

  if (error instanceof ApiProtocolError) {
    return {
      message: 'Сервер вернул некорректный ответ.',
      retryable: false,
    }
  }

  if (error instanceof ApiProblemError) {
    switch (error.code) {
      case 'AUTHORIZATION_DENIED':
        return {
          message: 'Недостаточно прав для этого действия.',
          retryable: false,
        }
      case 'RATE_LIMIT_EXCEEDED':
        return {
          message: 'Слишком много запросов. Повторите попытку позже.',
          retryable: false,
        }
      case 'DEPENDENCY_UNAVAILABLE':
        return {
          message: 'Сервис временно недоступен.',
          requestId: error.requestId,
          retryable: true,
        }
      case 'INTERNAL_ERROR':
        return {
          message: 'Не удалось выполнить запрос.',
          requestId: error.requestId,
          retryable: true,
        }
      default:
        return {
          message: 'Не удалось выполнить запрос.',
          ...(error.status >= 500 ? { requestId: error.requestId } : {}),
          retryable: error.status >= 500,
        }
    }
  }

  return {
    message: 'Произошла непредвиденная ошибка.',
    retryable: false,
  }
}
