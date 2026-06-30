import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { AxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './api-client'

const createResponse = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown = {},
): AxiosResponse => ({
  config,
  data,
  headers: {},
  status,
  statusText: status >= 400 ? 'Request failed' : 'OK',
})

const rejectResponse = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown = {
    statusCode: status,
    message: 'Request failed',
    error: 'Request failed',
  },
) =>
  Promise.reject(
    new AxiosError(
      'Request failed',
      undefined,
      config,
      undefined,
      createResponse(config, status, data),
    ),
  )

describe('apiClient', () => {
  const originalAdapter = apiClient.defaults.adapter

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('uses cookie credentials and ignores legacy localStorage tokens', async () => {
    window.localStorage.setItem('amazing-ekb-admin.access-token', 'old-access')
    window.localStorage.setItem(
      'amazing-ekb-admin.refresh-token',
      'old-refresh',
    )

    let capturedConfig: InternalAxiosRequestConfig | undefined
    const adapter: AxiosAdapter = async (config) => {
      capturedConfig = config
      return createResponse(config, 200, { ok: true })
    }

    apiClient.defaults.adapter = adapter

    await apiClient.get('/auth/me')

    expect(apiClient.defaults.withCredentials).toBe(true)
    expect(capturedConfig?.withCredentials).toBe(true)
    expect(capturedConfig?.headers.Authorization).toBeUndefined()
  })

  it('refreshes cookies once with empty body and retries the original request', async () => {
    const calls: InternalAxiosRequestConfig[] = []
    const adapter: AxiosAdapter = async (config) => {
      calls.push(config)

      if (calls.length === 1) {
        return rejectResponse(config, 401, {
          statusCode: 401,
          message: 'Invalid access token',
          error: 'Unauthorized',
        })
      }

      return createResponse(config, calls.length === 2 ? 204 : 200, {
        ok: true,
      })
    }

    apiClient.defaults.adapter = adapter

    await expect(apiClient.get('/admin/places')).resolves.toMatchObject({
      data: { ok: true },
    })

    expect(calls.map((call) => call.url)).toEqual([
      '/admin/places',
      '/auth/refresh',
      '/admin/places',
    ])
    expect(calls[1]?.method).toBe('post')
    expect(calls[1]?.data).toBeUndefined()
    expect(
      calls.every((call) => call.headers.Authorization === undefined),
    ).toBe(true)
  })

  it('does not refresh again when the retried request still returns 401', async () => {
    const calls: InternalAxiosRequestConfig[] = []
    const adapter: AxiosAdapter = async (config) => {
      calls.push(config)

      if (calls.length > 3) {
        throw new Error('Unexpected refresh loop')
      }

      if (config.url === '/auth/refresh') {
        return createResponse(config, 204)
      }

      return rejectResponse(config, 401, {
        statusCode: 401,
        message: 'Authentication required',
        error: 'Unauthorized',
      })
    }

    apiClient.defaults.adapter = adapter

    await expect(apiClient.get('/admin/places')).rejects.toMatchObject({
      kind: 'auth',
      status: 401,
    })

    expect(calls.map((call) => call.url)).toEqual([
      '/admin/places',
      '/auth/refresh',
      '/admin/places',
    ])
  })

  it('does not start refresh loops for auth endpoints', async () => {
    const calls: InternalAxiosRequestConfig[] = []
    const adapter: AxiosAdapter = async (config) => {
      calls.push(config)
      return rejectResponse(config, 401, {
        statusCode: 401,
        message: 'Authentication required',
        error: 'Unauthorized',
      })
    }

    apiClient.defaults.adapter = adapter

    await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({
      kind: 'auth',
      status: 401,
    })
    await expect(apiClient.post('/auth/refresh')).rejects.toMatchObject({
      kind: 'auth',
      status: 401,
    })
    await expect(apiClient.post('/auth/logout')).rejects.toMatchObject({
      kind: 'auth',
      status: 401,
    })

    expect(calls.map((call) => call.url)).toEqual([
      '/auth/login',
      '/auth/refresh',
      '/auth/logout',
    ])
  })
})
