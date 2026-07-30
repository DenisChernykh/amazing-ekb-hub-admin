import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { currentSessionQueryKey } from '@/entities/session'
import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import {
  clearCsrfToken,
  peekCsrfToken,
  setCsrfToken,
  type CurrentUserResponseDto,
} from '@/shared/api'
import { server } from '@/test/msw/server'

import { LogoutButton } from './logout-button'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

const currentUser: CurrentUserResponseDto = {
  normalizedEmail: 'admin@example.test',
  permissions: ['admin.dashboard.read'],
  roleKeys: ['admin'],
  userId: 'admin-1',
}

function problem(status: number, code: string) {
  return HttpResponse.json(
    {
      code,
      detail: 'Raw backend detail must stay hidden',
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

function renderLogout() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
  queryClient.setQueryData(currentSessionQueryKey(), currentUser)
  const router = createMemoryRouter(
    [
      { path: '/', element: <LogoutButton /> },
      { path: '/login', element: <p>Login route</p> },
    ],
    { initialEntries: ['/'] },
  )

  render(
    <AntdApp>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AntdApp>,
  )

  return { queryClient, router }
}

describe('LogoutButton', () => {
  beforeEach(() => {
    clearCsrfToken()
    setCsrfToken('csrf-before-logout')
    window.sessionStorage.clear()
    saveBulkModerationDraftSelection([
      { id: 'place-1', status: 'active', title: 'Аквацентр' },
    ])
  })

  afterEach(() => {
    clearCsrfToken()
    window.sessionStorage.clear()
  })

  it('sends CSRF and clears all local auth state after success', async () => {
    let csrfHeader: string | null = null
    server.use(
      http.post('http://api.test/v1/auth/logout', ({ request }) => {
        csrfHeader = request.headers.get('X-CSRF-Token')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { queryClient, router } = renderLogout()

    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(await screen.findByText('Login route')).toBeInTheDocument()
    expect(csrfHeader).toBe('csrf-before-logout')
    expect(queryClient.getQueryData(currentSessionQueryKey())).toBeUndefined()
    expect(peekCsrfToken()).toBeNull()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('cleans up and redirects when the backend session already expired', async () => {
    server.use(
      http.post('http://api.test/v1/auth/logout', () =>
        problem(401, 'AUTHENTICATION_REQUIRED'),
      ),
    )
    const { queryClient, router } = renderLogout()

    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(await screen.findByText('Login route')).toBeInTheDocument()
    expect(queryClient.getQueryData(currentSessionQueryKey())).toBeUndefined()
    expect(peekCsrfToken()).toBeNull()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
    expect(router.state.location.pathname).toBe('/login')
    expect(
      screen.queryByText('Не удалось выйти. Повторите попытку.'),
    ).not.toBeInTheDocument()
  })

  it('preserves local state and shows only safe retry copy for other errors', async () => {
    server.use(
      http.post('http://api.test/v1/auth/logout', () =>
        problem(503, 'DEPENDENCY_UNAVAILABLE'),
      ),
    )
    const { queryClient, router } = renderLogout()

    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(
      await screen.findByText('Не удалось выйти. Повторите попытку.'),
    ).toBeInTheDocument()
    expect(queryClient.getQueryData(currentSessionQueryKey())).toEqual(
      currentUser,
    )
    expect(peekCsrfToken()).toBe('csrf-before-logout')
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).not.toBeNull()
    expect(router.state.location.pathname).toBe('/')
    expect(
      screen.queryByText('Raw backend detail must stay hidden'),
    ).not.toBeInTheDocument()
  })
})
