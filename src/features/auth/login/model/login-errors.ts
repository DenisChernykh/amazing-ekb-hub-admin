import {
  ApiNetworkError,
  ApiProblemError,
  ApiProtocolError,
} from '@/shared/api'

/** Поля login-формы с разрешёнными server validation details. */
export type LoginField = 'email' | 'password'

type ValidationProblem = {
  errors?: ReadonlyArray<{
    pointer: string
    code: string
    detail: string
  }>
}

const fieldByPointer: Readonly<Record<string, LoginField>> = {
  '/email': 'email',
  '/password': 'password',
}

/**
 * Сопоставляет server validation errors с разрешёнными полями login-формы.
 *
 * @remarks Показывает backend `detail` только для `/email` и `/password`;
 * неизвестные pointers игнорирует.
 */
export function mapLoginValidationErrors(problem: ValidationProblem) {
  const result: Partial<Record<LoginField, string>> = {}

  for (const error of problem.errors ?? []) {
    const field = fieldByPointer[error.pointer]

    if (field !== undefined && result[field] === undefined) {
      result[field] = error.detail
    }
  }

  return result
}

/**
 * Возвращает безопасное общее сообщение об ошибке входа.
 *
 * @remarks Никогда не переносит backend `title`, `detail` или field `detail` в
 * global feedback. Для неизвестной problem response оставляет только request ID.
 *
 * @returns Локализованный текст login-ошибки.
 */
export function getLoginFormError(error: unknown) {
  if (
    error instanceof ApiProblemError &&
    error.code === 'AUTHENTICATION_REQUIRED'
  ) {
    return 'Неверный email или пароль'
  }

  if (
    error instanceof ApiProblemError &&
    error.code === 'RATE_LIMIT_EXCEEDED'
  ) {
    return 'Слишком много запросов. Повторите попытку позже.'
  }

  if (
    error instanceof ApiProblemError &&
    error.code === 'DEPENDENCY_UNAVAILABLE'
  ) {
    return 'Сервис временно недоступен.'
  }

  if (error instanceof ApiNetworkError) {
    return 'Не удалось подключиться к серверу.'
  }

  if (error instanceof ApiProtocolError) {
    return 'Сервер вернул некорректный ответ.'
  }

  if (error instanceof ApiProblemError) {
    return `Не удалось выполнить вход. Код запроса: ${error.requestId}`
  }

  return 'Не удалось выполнить вход.'
}
