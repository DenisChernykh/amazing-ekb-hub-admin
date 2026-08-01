import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { adminPlacesUploadPhoto } from '@/shared/api'
import { server } from '@/test/msw/server'

import { API_AXIOS_INSTANCE } from './axios-client'
import { clearCsrfToken } from './csrf-token'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

describe('credentialed Axios transport', () => {
  beforeEach(clearCsrfToken)

  it('sends credentials without fetching or attaching CSRF for GET', async () => {
    let csrfRequests = 0
    let credentials: RequestCredentials | undefined
    let csrfHeader: string | null = 'unexpected'

    server.use(
      http.get('http://api.test/v1/auth/csrf', () => {
        csrfRequests += 1
        return HttpResponse.json({ csrfToken: 'csrf-token' })
      }),
      http.get('http://api.test/v1/auth/me', ({ request }) => {
        credentials = request.credentials
        csrfHeader = request.headers.get('X-CSRF-Token')
        return HttpResponse.json({ userId: 'admin-id' })
      }),
    )

    await API_AXIOS_INSTANCE.get('/v1/auth/me')

    expect(credentials).toBe('include')
    expect(csrfHeader).toBeNull()
    expect(csrfRequests).toBe(0)
  })

  it('sends login JSON without fetching or attaching CSRF', async () => {
    let csrfRequests = 0
    let body: unknown
    let contentType: string | null = null
    let csrfHeader: string | null = 'unexpected'

    server.use(
      http.get('http://api.test/v1/auth/csrf', () => {
        csrfRequests += 1
        return HttpResponse.json({ csrfToken: 'csrf-token' })
      }),
      http.post('http://api.test/v1/auth/login', async ({ request }) => {
        body = await request.json()
        contentType = request.headers.get('Content-Type')
        csrfHeader = request.headers.get('X-CSRF-Token')
        return HttpResponse.json({ csrfToken: 'login-token' })
      }),
    )

    await API_AXIOS_INSTANCE.post('/v1/auth/login', {
      email: 'admin@example.test',
      password: 'unit-test-password',
    })

    expect(body).toEqual({
      email: 'admin@example.test',
      password: 'unit-test-password',
    })
    expect(contentType).toContain('application/json')
    expect(csrfHeader).toBeNull()
    expect(csrfRequests).toBe(0)
  })

  it('exempts only the exact versioned login path from CSRF', async () => {
    let csrfRequests = 0
    let csrfHeader: string | null = null

    server.use(
      http.get('http://api.test/v1/auth/csrf', () => {
        csrfRequests += 1
        return HttpResponse.json({ csrfToken: 'exact-path-token' })
      }),
      http.post('http://api.test/v1/auth/login/audit', ({ request }) => {
        csrfHeader = request.headers.get('X-CSRF-Token')
        return HttpResponse.json({ ok: true })
      }),
    )

    await API_AXIOS_INSTANCE.post('/v1/auth/login/audit', {})

    expect(csrfRequests).toBe(1)
    expect(csrfHeader).toBe('exact-path-token')
  })

  it('fetches CSRF before sending an empty JSON logout request', async () => {
    const callOrder: string[] = []
    let body = ''
    let csrfCredentials: RequestCredentials | undefined
    let csrfHeader: string | null = null

    server.use(
      http.get('http://api.test/v1/auth/csrf', ({ request }) => {
        callOrder.push('csrf')
        csrfCredentials = request.credentials
        return HttpResponse.json({ csrfToken: 'logout-token' })
      }),
      http.post('http://api.test/v1/auth/logout', async ({ request }) => {
        callOrder.push('logout')
        body = await request.text()
        csrfHeader = request.headers.get('X-CSRF-Token')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await API_AXIOS_INSTANCE.post('/v1/auth/logout')

    expect(callOrder).toEqual(['csrf', 'logout'])
    expect(body).toBe('{}')
    expect(csrfCredentials).toBe('include')
    expect(csrfHeader).toBe('logout-token')
  })

  it('preserves generated multipart uploads and attaches CSRF', async () => {
    let contentType: string | null = null
    let csrfHeader: string | null = null
    let receivedBody = ''

    server.use(
      http.get('http://api.test/v1/auth/csrf', () =>
        HttpResponse.json({ csrfToken: 'upload-token' }),
      ),
      http.post(
        'http://api.test/v1/admin/places/place-1/photo',
        async ({ request }) => {
          contentType = request.headers.get('Content-Type')
          csrfHeader = request.headers.get('X-CSRF-Token')
          receivedBody = await request.text()

          return HttpResponse.json({ id: 'place-1' })
        },
      ),
    )

    const photo = new File(['image-bytes'], 'cover.png', {
      type: 'image/png',
    })

    await adminPlacesUploadPhoto({ placeId: 'place-1' }, { photo })

    expect(contentType).toMatch(/^multipart\/form-data; boundary=/)
    expect(csrfHeader).toBe('upload-token')
    expect(receivedBody).toContain(
      'Content-Disposition: form-data; name="photo"; filename="',
    )
    expect(receivedBody).toContain('Content-Type: image/png')
  })

  it('shares one CSRF fetch between parallel unsafe requests', async () => {
    let csrfRequests = 0
    const csrfHeaders: Array<string | null> = []

    server.use(
      http.get('http://api.test/v1/auth/csrf', () => {
        csrfRequests += 1
        return HttpResponse.json({ csrfToken: 'shared-token' })
      }),
      http.post('http://api.test/v1/auth/logout', ({ request }) => {
        csrfHeaders.push(request.headers.get('X-CSRF-Token'))
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await Promise.all([
      API_AXIOS_INSTANCE.post('/v1/auth/logout'),
      API_AXIOS_INSTANCE.post('/v1/auth/logout'),
    ])

    expect(csrfRequests).toBe(1)
    expect(csrfHeaders).toEqual(['shared-token', 'shared-token'])
  })

  it('reuses the cached CSRF token for a later unsafe request', async () => {
    let csrfRequests = 0

    server.use(
      http.get('http://api.test/v1/auth/csrf', () => {
        csrfRequests += 1
        return HttpResponse.json({ csrfToken: 'cached-token' })
      }),
      http.post('http://api.test/v1/auth/logout', () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await API_AXIOS_INSTANCE.post('/v1/auth/logout')
    await API_AXIOS_INSTANCE.post('/v1/auth/logout')

    expect(csrfRequests).toBe(1)
  })

  it('does not refresh after a 401 response', async () => {
    const legacyRefreshPath = ['/auth', 'refresh'].join('/')
    let refreshRequests = 0

    server.use(
      http.get('http://api.test/v1/admin/places', () =>
        HttpResponse.json(
          {
            error: 'Unauthorized',
            message: 'Authentication required',
            statusCode: 401,
          },
          { status: 401 },
        ),
      ),
      http.post(`http://api.test${legacyRefreshPath}`, () => {
        refreshRequests += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(
      API_AXIOS_INSTANCE.get('/v1/admin/places'),
    ).rejects.toBeDefined()
    expect(refreshRequests).toBe(0)
  })
})
