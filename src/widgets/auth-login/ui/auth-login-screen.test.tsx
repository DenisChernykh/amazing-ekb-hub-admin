import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearCsrfToken } from '@/shared/api'
import { server } from '@/test/msw/server'

import { AuthLoginScreen } from './auth-login-screen'

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

function PlacesRouteProbe() {
  const location = useLocation()

  return <p>Fresh route: {location.search}</p>
}

function renderLoginScreen(initialEntry = '/login') {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
  const router = createMemoryRouter(
    [
      { path: '/login', element: <AuthLoginScreen /> },
      { path: '/places', element: <PlacesRouteProbe /> },
    ],
    { initialEntries: [initialEntry] },
  )

  render(
    <AntdApp>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AntdApp>,
  )

  return router
}

describe('AuthLoginScreen', () => {
  beforeEach(clearCsrfToken)
  afterEach(clearCsrfToken)

  it('sets the login document title', () => {
    renderLoginScreen()

    expect(document.title).toBe('Вход | Amazing EKB Admin')
    expect(
      screen.getByRole('heading', { name: 'Amazing EKB Hub Admin' }),
    ).toBeInTheDocument()
  })

  it('preserves returnTo from the query string across a fresh router initialization', async () => {
    server.use(
      http.post('http://api.test/v1/auth/login', () =>
        HttpResponse.json(loginResponse),
      ),
    )
    const router = renderLoginScreen(
      '/login?returnTo=%2Fplaces%3Fstatus%3Dhidden',
    )
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Email'), 'admin@example.test')
    await user.type(screen.getByLabelText('Пароль'), 'unit-test-password')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText('Fresh route: ?status=hidden'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/places')
    expect(router.state.location.search).toBe('?status=hidden')
  })
})
