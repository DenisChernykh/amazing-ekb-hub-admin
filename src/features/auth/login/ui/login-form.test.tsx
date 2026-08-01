import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppQueryClient } from '@/app/query-client'
import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { clearCsrfToken, peekCsrfToken, type ProblemCode } from '@/shared/api'
import { server } from '@/test/msw/server'

import { LoginForm } from './login-form'

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

  return <p>Places route: {location.search}</p>
}

function renderLogin(
  returnTo: string | null = '/places',
  onAuthenticationRequired = vi.fn(),
) {
  const queryClient = createAppQueryClient({
    onAuthenticationRequired,
  })
  const router = createMemoryRouter(
    [
      {
        path: '/login',
        element: <LoginForm returnTo={returnTo} />,
      },
      {
        path: '/places',
        element: <PlacesRouteProbe />,
      },
    ],
    { initialEntries: ['/login'] },
  )

  render(
    <AntdApp>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AntdApp>,
  )

  return { onAuthenticationRequired, router }
}

async function fillValidCredentials() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), 'admin@example.test')
  await user.type(screen.getByLabelText('Пароль'), 'unit-test-password')

  return user
}

function problem(
  status: number,
  code: ProblemCode,
  errors?: Array<{ pointer: string; code: string; detail: string }>,
) {
  return HttpResponse.json(
    {
      code,
      detail: 'Raw backend detail must stay hidden',
      ...(errors === undefined ? {} : { errors }),
      instance: `urn:request:${status}`,
      requestId: `request-${status}`,
      status,
      title: 'Raw backend title must stay hidden',
      type: `https://example.test/problems/${code.toLowerCase()}`,
    },
    {
      headers: { 'Content-Type': 'application/problem+json' },
      status,
    },
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    clearCsrfToken()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    clearCsrfToken()
    window.sessionStorage.clear()
  })

  it('rejects invalid local values without an HTTP request', async () => {
    let loginRequests = 0
    server.use(
      http.post('http://api.test/v1/auth/login', () => {
        loginRequests += 1
        return HttpResponse.json(loginResponse)
      }),
    )
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Пароль'), 'unit-test-password')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Неверный email адрес')).toBeInTheDocument()
    expect(loginRequests).toBe(0)
  })

  it('maps only allowlisted 422 pointers to RHF fields', async () => {
    server.use(
      http.post('http://api.test/v1/auth/login', () =>
        problem(422, 'VALIDATION_FAILED', [
          {
            code: 'invalid_email',
            detail: 'Backend email copy',
            pointer: '/email',
          },
          {
            code: 'invalid_password',
            detail: 'Backend password copy',
            pointer: '/password',
          },
          {
            code: 'forbidden_role',
            detail: 'Backend role detail must stay hidden',
            pointer: '/role',
          },
        ]),
      ),
    )
    renderLogin()
    const user = await fillValidCredentials()

    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Backend email copy')).toBeInTheDocument()
    expect(screen.getByText('Backend password copy')).toBeInTheDocument()
    expect(
      screen.queryByText('Backend role detail must stay hidden'),
    ).not.toBeInTheDocument()
  })

  it('shows safe credentials copy for a 401 response', async () => {
    server.use(
      http.post('http://api.test/v1/auth/login', () =>
        problem(401, 'AUTHENTICATION_REQUIRED'),
      ),
    )
    const { onAuthenticationRequired, router } = renderLogin()
    const user = await fillValidCredentials()

    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText('Неверный email или пароль'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Raw backend detail must stay hidden'),
    ).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(onAuthenticationRequired).not.toHaveBeenCalled()
  })

  it('hands off CSRF, clears the draft, navigates, and does not fetch auth/me', async () => {
    let currentSessionRequests = 0
    server.use(
      http.post('http://api.test/v1/auth/login', () =>
        HttpResponse.json(loginResponse),
      ),
      http.get('http://api.test/v1/auth/me', () => {
        currentSessionRequests += 1
        return problem(503, 'DEPENDENCY_UNAVAILABLE')
      }),
    )
    saveBulkModerationDraftSelection([
      { id: 'place-1', status: 'active', title: 'Аквацентр' },
    ])
    const { router } = renderLogin('/places?status=hidden')
    const user = await fillValidCredentials()

    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText('Places route: ?status=hidden'),
    ).toBeInTheDocument()
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

  it('shows pending state and blocks repeated login submissions', async () => {
    let releaseLogin!: () => void
    let loginRequests = 0
    const loginGate = new Promise<void>((resolve) => {
      releaseLogin = resolve
    })
    server.use(
      http.post('http://api.test/v1/auth/login', async () => {
        loginRequests += 1
        await loginGate
        return HttpResponse.json(loginResponse)
      }),
    )
    renderLogin()
    const user = await fillValidCredentials()
    const submitButton = screen.getByRole('button', { name: 'Войти' })

    await user.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toHaveClass('ant-btn-loading')
    })
    await user.click(submitButton)
    expect(loginRequests).toBe(1)
    releaseLogin()
    expect(await screen.findByText('Places route:')).toBeInTheDocument()
  })
})
