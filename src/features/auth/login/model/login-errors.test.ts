import { describe, expect, it, vi } from 'vitest'

import {
  ApiNetworkError,
  ApiProblemError,
  ApiProtocolError,
  type ProblemCode,
} from '@/shared/api'

import { getLoginFormError, mapLoginValidationErrors } from './login-errors'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

function createProblemError(
  code: ProblemCode,
  status: number,
  requestId = 'request-1',
) {
  return new ApiProblemError(
    {
      code,
      detail: 'Backend detail must stay hidden',
      instance: `urn:request:${requestId}`,
      requestId,
      status,
      title: 'Backend title must stay hidden',
      type: `https://example.test/problems/${code.toLowerCase()}`,
    },
    null,
  )
}

describe('mapLoginValidationErrors', () => {
  it('maps allowlisted field details and ignores an unknown role pointer', () => {
    expect(
      mapLoginValidationErrors({
        errors: [
          {
            code: 'invalid_email',
            detail: 'Введите рабочий email',
            pointer: '/email',
          },
          {
            code: 'invalid_password',
            detail: 'Введите пароль',
            pointer: '/password',
          },
          {
            code: 'forbidden_role',
            detail: 'Backend role detail must stay hidden',
            pointer: '/role',
          },
        ],
      }),
    ).toEqual({
      email: 'Введите рабочий email',
      password: 'Введите пароль',
    })
  })
})

describe('getLoginFormError', () => {
  it.each([
    [
      createProblemError('AUTHENTICATION_REQUIRED', 401),
      'Неверный email или пароль',
    ],
    [
      createProblemError('RATE_LIMIT_EXCEEDED', 429),
      'Слишком много запросов. Повторите попытку позже.',
    ],
    [
      createProblemError('DEPENDENCY_UNAVAILABLE', 503),
      'Сервис временно недоступен.',
    ],
    [new ApiNetworkError(), 'Не удалось подключиться к серверу.'],
    [new ApiProtocolError(), 'Сервер вернул некорректный ответ.'],
    [
      createProblemError('INTERNAL_ERROR', 500, 'request-500'),
      'Не удалось выполнить вход. Код запроса: request-500',
    ],
    [new Error('unknown'), 'Не удалось выполнить вход.'],
  ])('maps an API failure to safe login copy', (error, expected) => {
    expect(getLoginFormError(error)).toBe(expected)
  })
})
