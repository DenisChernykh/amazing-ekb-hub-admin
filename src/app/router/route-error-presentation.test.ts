import {
  ApiNetworkError,
  ApiProtocolError,
} from '@/shared/api/client/api-errors'
import { createApiProblemError } from '@/test/api-problem'
import { describe, expect, it } from 'vitest'
import { getRouteErrorPresentation } from './route-error-presentation'

describe('getRouteErrorPresentation', () => {
  it('uses route-specific safe copy for authorization denial', () => {
    const presentation = getRouteErrorPresentation(
      createApiProblemError('AUTHORIZATION_DENIED', 403),
    )

    expect(presentation).toEqual({
      message: 'Недостаточно прав для открытия страницы.',
      retryable: false,
    })
  })

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
      createApiProblemError('INTERNAL_ERROR', 500, {
        requestId: 'request-route-500',
      }),
      {
        message: 'Не удалось выполнить запрос.',
        requestId: 'request-route-500',
        retryable: true,
      },
    ],
  ])('keeps the shared safe API presentation for %#', (error, expected) => {
    expect(getRouteErrorPresentation(error)).toEqual(expected)
  })

  it('never exposes backend Problem Details title, detail, or field detail', () => {
    const presentation = getRouteErrorPresentation(
      createApiProblemError('INTERNAL_ERROR', 500),
    )
    const serialized = JSON.stringify(presentation)

    expect(serialized).not.toContain('Raw backend title')
    expect(serialized).not.toContain('Raw backend detail')
    expect(serialized).not.toContain('Raw backend field detail')
  })
})
