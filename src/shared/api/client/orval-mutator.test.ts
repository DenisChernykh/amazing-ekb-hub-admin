import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '@/test/msw/server'

import { ApiClientError } from './api-error'
import { setCsrfToken } from './csrf-token'
import { apiMutator } from './orval-mutator'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

describe('Orval API mutator', () => {
  beforeEach(() => {
    setCsrfToken('cached-token')
  })

  it('preserves config and caller option headers during the merge', async () => {
    let receivedHeaders: Headers | undefined

    server.use(
      http.post('http://api.test/v1/custom', ({ request }) => {
        receivedHeaders = request.headers
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiMutator(
      {
        data: { value: 'payload' },
        headers: {
          'X-Config-Header': 'config',
          'X-Shared-Header': 'config',
        },
        method: 'POST',
        url: '/v1/custom',
      },
      {
        headers: {
          'X-Options-Header': 'options',
          'X-Shared-Header': 'options',
        },
      },
    )

    expect(receivedHeaders?.get('X-Config-Header')).toBe('config')
    expect(receivedHeaders?.get('X-Options-Header')).toBe('options')
    expect(receivedHeaders?.get('X-Shared-Header')).toBe('options')
    expect(receivedHeaders?.get('X-CSRF-Token')).toBe('cached-token')
  })

  it.each([
    ['/health/ready', { checks: { postgres: 'down' }, status: 'unavailable' }],
    ['/health/startup', { status: 'starting' }],
  ])(
    'returns JSON 503 data from operational endpoint %s',
    async (url, body) => {
      server.use(
        http.get(`http://api.test${url}`, () =>
          HttpResponse.json(body, { status: 503 }),
        ),
      )

      await expect(apiMutator({ method: 'GET', url })).resolves.toEqual(body)
    },
  )

  it('normalizes a non-operational 503 response', async () => {
    server.use(
      http.get('http://api.test/v1/admin/places', () =>
        HttpResponse.json(
          {
            error: 'Service unavailable',
            message: 'Database unavailable',
            statusCode: 503,
          },
          { status: 503 },
        ),
      ),
    )

    const failure = apiMutator({
      method: 'GET',
      url: '/v1/admin/places',
    })

    await expect(failure).rejects.toBeInstanceOf(ApiClientError)
    await expect(failure).rejects.toMatchObject({
      kind: 'server',
      status: 503,
    })
  })

  it('preserves an explicit caller validateStatus policy', async () => {
    const body = { status: 'unavailable' }
    server.use(
      http.get('http://api.test/custom-health', () =>
        HttpResponse.json(body, { status: 503 }),
      ),
    )

    await expect(
      apiMutator(
        { method: 'GET', url: '/custom-health' },
        { validateStatus: null },
      ),
    ).resolves.toEqual(body)
  })
})
