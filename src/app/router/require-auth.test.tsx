import { useCurrentUser } from '@/entities/session/model/current-user'
import { useCurrentSessionQuery } from '@/entities/session/model/session-hooks'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { AuthMeResponse } from '@/shared/api/generated/model'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireAuth } from './require-auth'

vi.mock('@/entities/session/model/session-hooks', () => ({
  useCurrentSessionQuery: vi.fn(),
}))

const mockedUseCurrentSessionQuery = vi.mocked(useCurrentSessionQuery)

const admin: AuthMeResponse = {
  email: 'admin@amazing-ekb.ru',
  id: 'admin-1',
  role: 'admin',
}

function PrivateRouteProbe() {
  const user = useCurrentUser()

  return <div>Private route for {user.email}</div>
}

const renderProtectedRoute = () => {
  const router = createMemoryRouter(
    [
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/',
            element: <PrivateRouteProbe />,
          },
        ],
      },
      {
        path: '/login',
        element: <div>Login route</div>,
      },
    ],
    {
      initialEntries: ['/'],
    },
  )

  render(<RouterProvider router={router} />)
}

describe('RequireAuth', () => {
  beforeEach(() => {
    mockedUseCurrentSessionQuery.mockReset()
  })

  it('shows a session loading state while current user is pending', () => {
    mockedUseCurrentSessionQuery.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isPending: true,
    } as ReturnType<typeof useCurrentSessionQuery>)

    renderProtectedRoute()

    expect(screen.getByText('Проверяем сессию')).toBeInTheDocument()
  })

  it('redirects anonymous users to login route', async () => {
    mockedUseCurrentSessionQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'auth',
        message: 'Authentication required',
        status: 401,
      }),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useCurrentSessionQuery>)

    renderProtectedRoute()

    expect(await screen.findByText('Login route')).toBeInTheDocument()
  })

  it('shows forbidden state for permission errors', () => {
    mockedUseCurrentSessionQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'permission',
        message: 'Forbidden',
        status: 403,
      }),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useCurrentSessionQuery>)

    renderProtectedRoute()

    expect(screen.getByText('Доступ запрещен')).toBeInTheDocument()
  })

  it('renders private route with current user context', () => {
    mockedUseCurrentSessionQuery.mockReturnValue({
      data: admin,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof useCurrentSessionQuery>)

    renderProtectedRoute()

    expect(
      screen.getByText('Private route for admin@amazing-ekb.ru'),
    ).toBeInTheDocument()
  })
})
