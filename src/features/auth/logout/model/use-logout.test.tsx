import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

import { useLogout } from './use-logout'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

const currentUser: CurrentUserResponseDto = {
  normalizedEmail: 'admin@example.test',
  permissions: ['admin.dashboard.read'],
  roleKeys: ['admin'],
  userId: 'admin-1',
}

function LogoutProbe() {
  const logout = useLogout()

  return (
    <button onClick={() => logout.mutate()} type="button">
      Logout probe
    </button>
  )
}

function renderLogoutProbe() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
  queryClient.setQueryData(currentSessionQueryKey(), currentUser)
  const router = createMemoryRouter(
    [
      { path: '/', element: <LogoutProbe /> },
      { path: '/login', element: <p>Login route</p> },
    ],
    { initialEntries: ['/'] },
  )

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { queryClient, router }
}

describe('useLogout', () => {
  beforeEach(() => {
    clearCsrfToken()
    setCsrfToken('csrf-before-logout')
    window.sessionStorage.clear()
  })

  afterEach(() => {
    clearCsrfToken()
    window.sessionStorage.clear()
  })

  it('treats an expired backend session as a completed local logout', async () => {
    server.use(
      http.post('http://api.test/v1/auth/logout', () =>
        HttpResponse.json(
          {
            code: 'AUTHENTICATION_REQUIRED',
            detail: 'Backend detail must stay hidden',
            instance: 'urn:request:401',
            requestId: 'request-401',
            status: 401,
            title: 'Authentication required',
            type: 'https://example.test/problems/authentication-required',
          },
          {
            headers: { 'Content-Type': 'application/problem+json' },
            status: 401,
          },
        ),
      ),
    )
    saveBulkModerationDraftSelection([
      { id: 'place-1', status: 'active', title: 'Аквацентр' },
    ])
    const { queryClient, router } = renderLogoutProbe()

    await userEvent.click(screen.getByRole('button', { name: 'Logout probe' }))

    expect(await screen.findByText('Login route')).toBeInTheDocument()
    expect(queryClient.getQueryData(currentSessionQueryKey())).toBeUndefined()
    expect(peekCsrfToken()).toBeNull()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
    expect(router.state.location.pathname).toBe('/login')
  })
})
