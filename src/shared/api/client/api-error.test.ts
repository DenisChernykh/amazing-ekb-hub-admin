import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiClientError, normalizeApiError } from './api-error'

const createAxiosError = (status: number, data: unknown) =>
  new AxiosError(
    'Request failed',
    undefined,
    {
      headers: new AxiosHeaders(),
    },
    undefined,
    {
      config: {
        headers: new AxiosHeaders(),
      },
      data,
      headers: {},
      status,
      statusText: 'Request failed',
    },
  )

describe('normalizeApiError', () => {
  it('normalizes standard Nest validation errors', () => {
    const error = normalizeApiError(
      createAxiosError(400, {
        statusCode: 400,
        message: ['title must be a string', 'category must be one of values'],
        error: 'Bad Request',
      }),
    )

    expect(error.kind).toBe('validation')
    expect(error.status).toBe(400)
    expect(error.message).toBe('title must be a string')
    expect(error.messages).toEqual([
      'title must be a string',
      'category must be one of values',
    ])
  })

  it('keeps permission errors separate from auth errors', () => {
    const error = normalizeApiError(
      createAxiosError(403, {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      }),
    )

    expect(error.kind).toBe('permission')
    expect(error.status).toBe(403)
    expect(error.messages).toEqual(['Forbidden resource'])
  })

  it('normalizes auth errors from standard Nest error body', () => {
    const error = normalizeApiError(
      createAxiosError(401, {
        statusCode: 401,
        message: 'Authentication required',
        error: 'Unauthorized',
      }),
    )

    expect(error.kind).toBe('auth')
    expect(error.status).toBe(401)
    expect(error.message).toBe('Authentication required')
    expect(error.messages).toEqual(['Authentication required'])
  })

  it('normalizes axios errors without response as network errors', () => {
    const error = normalizeApiError(new AxiosError('Network Error'))

    expect(error.kind).toBe('network')
    expect(error.status).toBeUndefined()
    expect(error.message).toBe('Network error')
  })

  it('keeps already-normalized API errors intact', () => {
    const original = new ApiClientError({
      kind: 'unknown',
      message: 'Already normalized',
    })

    expect(normalizeApiError(original)).toBe(original)
  })
})
