import { describe, expect, it } from 'vitest'

import {
  ApiNetworkError,
  ApiProblemError,
  ApiProtocolError,
  type ProblemCode,
} from '@/shared/api/client/api-errors'

import { getApiErrorPresentation } from './api-error-presentation'

function problemError(
  code: ProblemCode,
  status: number,
  requestId = 'request-problem',
) {
  return new ApiProblemError(
    {
      type: 'https://api.example.test/problems/test',
      title: 'Raw backend title',
      status,
      detail: 'Raw backend detail',
      instance: `urn:request:${requestId}`,
      code,
      requestId,
      errors: [
        {
          pointer: '/secret',
          code: 'FIELD_INVALID',
          detail: 'Raw backend field detail',
        },
      ],
    },
    null,
  )
}

describe('getApiErrorPresentation', () => {
  it.each([
    [
      new ApiNetworkError(),
      {
        message: 'Не удалось подключиться к серверу.',
        retryable: true,
      },
    ],
    [
      new ApiProtocolError(),
      {
        message: 'Сервер вернул некорректный ответ.',
        retryable: false,
      },
    ],
    [
      problemError('AUTHORIZATION_DENIED', 403),
      {
        message: 'Недостаточно прав для этого действия.',
        retryable: false,
      },
    ],
    [
      problemError('RATE_LIMIT_EXCEEDED', 429),
      {
        message: 'Слишком много запросов. Повторите попытку позже.',
        retryable: false,
      },
    ],
    [
      problemError('DEPENDENCY_UNAVAILABLE', 503, 'request-dependency'),
      {
        message: 'Сервис временно недоступен.',
        requestId: 'request-dependency',
        retryable: true,
      },
    ],
    [
      problemError('INTERNAL_ERROR', 500, 'request-internal'),
      {
        message: 'Не удалось выполнить запрос.',
        requestId: 'request-internal',
        retryable: true,
      },
    ],
    [
      new Error('Raw unknown error'),
      {
        message: 'Произошла непредвиденная ошибка.',
        retryable: false,
      },
    ],
  ])('returns a safe presentation for %#', (error, expected) => {
    expect(getApiErrorPresentation(error)).toEqual(expected)
  })

  it('does not expose backend title, detail, or field detail', () => {
    const presentation = getApiErrorPresentation(
      problemError('INTERNAL_ERROR', 500),
    )
    const serialized = JSON.stringify(presentation)

    expect(serialized).not.toContain('Raw backend title')
    expect(serialized).not.toContain('Raw backend detail')
    expect(serialized).not.toContain('Raw backend field detail')
  })
})
