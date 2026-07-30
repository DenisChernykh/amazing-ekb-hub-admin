import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { clearCsrfToken, peekCsrfToken } from '@/shared/api'
import { server } from '@/test/msw/server'

import { useLogin } from './use-login'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

const loginResponse = {
  csrfToken: 'A'.repeat(43),
  session: {
    absoluteExpiresAt: '2030-01-01T00:00:00.000Z',
    publicId: 'AbCdEfGhIjKlMnOpQrStUv',
  },
}

const credentials = {
  email: 'admin@example.test',
  password: 'unit-test-password',
}

function LoginProbe() {
  const login = useLogin('/places?status=hidden')

  return (
    <button onClick={() => login.mutate(credentials)} type="button">
      Login probe
    </button>
  )
}

function renderLoginProbe() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginProbe /> },
      { path: '/places', element: <p>Places route</p> },
    ],
    { initialEntries: ['/login'] },
  )

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return router
}

describe('useLogin', () => {
  beforeEach(() => {
    clearCsrfToken()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    clearCsrfToken()
    window.sessionStorage.clear()
  })

  it('hands off CSRF, clears the feature draft, and replaces the route', async () => {
    let currentSessionRequests = 0
    server.use(
      http.post('http://api.test/v1/auth/login', () =>
        HttpResponse.json(loginResponse),
      ),
      http.get('http://api.test/v1/auth/me', () => {
        currentSessionRequests += 1
        return HttpResponse.json({
          normalizedEmail: credentials.email,
          permissions: [],
          roleKeys: ['admin'],
          userId: 'admin-1',
        })
      }),
    )
    saveBulkModerationDraftSelection([
      { id: 'place-1', status: 'active', title: 'Аквацентр' },
    ])
    const router = renderLoginProbe()

    await userEvent.click(screen.getByRole('button', { name: 'Login probe' }))

    expect(await screen.findByText('Places route')).toBeInTheDocument()
    expect(peekCsrfToken()).toBe(loginResponse.csrfToken)
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
    expect(router.state.location.pathname).toBe('/places')
    expect(router.state.location.search).toBe('?status=hidden')
    expect(currentSessionRequests).toBe(0)
  })
})
