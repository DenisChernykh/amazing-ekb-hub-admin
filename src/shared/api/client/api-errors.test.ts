import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import {
  ApiNetworkError,
  ApiProblemError,
  ApiProtocolError,
  isProblemCode,
  normalizeApiError,
  type ProblemDocumentLike,
} from './api-errors'

const problem: ProblemDocumentLike = {
  type: 'https://api.example.test/problems/internal-error',
  title: 'Raw backend title',
  status: 500,
  detail: 'Raw backend detail',
  instance: 'urn:request:test',
  code: 'INTERNAL_ERROR',
  requestId: 'request-500',
  errors: [
    {
      pointer: '/secret',
      code: 'FIELD_INVALID',
      detail: 'Raw backend field detail',
    },
  ],
}

function createAxiosError({
  contentType = 'application/problem+json',
  data = problem,
  retryAfter,
  status = problem.status,
}: {
  contentType?: string
  data?: unknown
  retryAfter?: string
  status?: number
} = {}) {
  const headers = new AxiosHeaders({ 'content-type': contentType })
  if (retryAfter !== undefined) {
    headers.set('retry-after', retryAfter)
  }

  return new AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    {
      config: { headers: new AxiosHeaders() },
      data,
      headers,
      status,
      statusText: 'Request failed',
    },
  )
}

describe('normalizeApiError', () => {
  it('maps a response-less Axios error to ApiNetworkError', () => {
    expect(normalizeApiError(new AxiosError('Network Error'))).toBeInstanceOf(
      ApiNetworkError,
    )
  })

  it('maps a non-Axios value to ApiProtocolError', () => {
    expect(normalizeApiError(new Error('unexpected'))).toBeInstanceOf(
      ApiProtocolError,
    )
  })

  it('rejects an HTTP JSON response without the Problem Details media type', () => {
    const error = createAxiosError({
      contentType: 'application/json',
      data: {
        error: 'Internal Server Error',
        message: 'Raw legacy backend message',
        statusCode: 500,
      },
    })

    expect(normalizeApiError(error)).toBeInstanceOf(ApiProtocolError)
  })

  it('rejects a malformed Problem Details body', () => {
    expect(
      normalizeApiError(
        createAxiosError({
          data: { ...problem, requestId: undefined },
        }),
      ),
    ).toBeInstanceOf(ApiProtocolError)
  })

  it('rejects a problem status that differs from the HTTP status', () => {
    expect(normalizeApiError(createAxiosError({ status: 503 }))).toBeInstanceOf(
      ApiProtocolError,
    )
  })

  it('rejects VALIDATION_FAILED outside the required 422 status', () => {
    expect(
      normalizeApiError(
        createAxiosError({
          data: {
            ...problem,
            code: 'VALIDATION_FAILED',
            status: 400,
          },
          status: 400,
        }),
      ),
    ).toBeInstanceOf(ApiProtocolError)
  })

  it('preserves code, status, and requestId from a valid Problem Details body', () => {
    expect(normalizeApiError(createAxiosError())).toMatchObject({
      code: 'INTERNAL_ERROR',
      name: 'ApiProblemError',
      requestId: 'request-500',
      status: 500,
    })
  })

  it('converts numeric Retry-After seconds to milliseconds', () => {
    expect(
      normalizeApiError(createAxiosError({ retryAfter: '12' })),
    ).toMatchObject({
      retryAfterMs: 12_000,
    })
  })

  it('rejects numeric Retry-After values that overflow safe milliseconds', () => {
    expect(
      normalizeApiError(
        createAxiosError({
          retryAfter: '9007199254741',
        }),
      ),
    ).toMatchObject({
      retryAfterMs: null,
    })
  })

  it('converts a future Retry-After HTTP date relative to the injected time', () => {
    const now = Date.UTC(2030, 0, 1, 0, 0, 0)

    expect(
      normalizeApiError(
        createAxiosError({
          retryAfter: 'Tue, 01 Jan 2030 00:00:05 GMT',
        }),
        now,
      ),
    ).toMatchObject({
      retryAfterMs: 5_000,
    })
  })

  it.each(['0.5', '-1', 'not-a-date', 'Mon, 31 Dec 2029 23:59:59 GMT'])(
    'maps past or invalid Retry-After to null: %s',
    (retryAfter) => {
      expect(
        normalizeApiError(
          createAxiosError({ retryAfter }),
          Date.UTC(2030, 0, 1, 0, 0, 0),
        ),
      ).toMatchObject({
        retryAfterMs: null,
      })
    },
  )

  it.each([
    '2030-01-01T00:00:05Z',
    'January 1, 2030 00:00:05 GMT',
    '2030/01/01 00:00:05 GMT',
  ])('rejects a non-HTTP-date Retry-After value: %s', (retryAfter) => {
    expect(
      normalizeApiError(
        createAxiosError({ retryAfter }),
        Date.UTC(2030, 0, 1, 0, 0, 0),
      ),
    ).toMatchObject({
      retryAfterMs: null,
    })
  })
})

describe('isProblemCode', () => {
  it('narrows only an ApiProblemError with the matching backend code', () => {
    const error = new ApiProblemError(problem, null)

    expect(isProblemCode(error, 'INTERNAL_ERROR')).toBe(true)
    expect(isProblemCode(error, 'DEPENDENCY_UNAVAILABLE')).toBe(false)
    expect(isProblemCode(new ApiNetworkError(), 'INTERNAL_ERROR')).toBe(false)
    expect(isProblemCode(problem, 'INTERNAL_ERROR')).toBe(false)
  })
})
