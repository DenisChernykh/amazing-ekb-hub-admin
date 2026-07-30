import { useCurrentUser } from '@/entities/session/model/current-user'
import { useCurrentSessionQuery } from '@/entities/session/model/session-hooks'
import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import type {
  AdminPlaceSummaryResponseDto,
  CurrentUserResponseDto,
  PlaceCategoryResponseDto,
} from '@/shared/api'
import { ApiClientError } from '@/shared/api/client/api-error'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireAuth } from './require-auth'

vi.mock('@/entities/session/model/session-hooks', () => ({
  useCurrentSessionQuery: vi.fn(),
}))

const mockedUseCurrentSessionQuery = vi.mocked(useCurrentSessionQuery)

const admin: CurrentUserResponseDto = {
  normalizedEmail: 'admin@example.test',
  permissions: ['admin.dashboard.read'],
  roleKeys: ['admin'],
  userId: 'admin-1',
}

const poolsCategory = {
  coverImageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  status: 'active',
  updatedAt: '2026-01-01T00:00:00.000Z',
  id: 'category_pools',
  slug: 'pools',
  title: 'Бассейны',
} satisfies PlaceCategoryResponseDto

const activePlace: AdminPlaceSummaryResponseDto = {
  category: poolsCategory,
  coverImageUrl: null,
  mapsUrl: null,
  id: 'place-1',
  slug: 'aquacenter',
  status: 'active',
  summary: 'Теплый бассейн',
  tags: ['pool'],
  title: 'Аквацентр',
}

function PrivateRouteProbe() {
  const user = useCurrentUser()

  return <div>Private route for {user.normalizedEmail}</div>
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
    window.sessionStorage.clear()
    mockedUseCurrentSessionQuery.mockReset()
  })

  afterEach(() => {
    window.sessionStorage.clear()
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

  it('clears bulk moderation draft when the current session is lost', async () => {
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
    saveBulkModerationDraftSelection([activePlace])

    renderProtectedRoute()

    await waitFor(() => {
      expect(
        window.sessionStorage.getItem(
          BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
        ),
      ).toBeNull()
    })
  })

  it('keeps bulk moderation draft for transient current-session errors', async () => {
    mockedUseCurrentSessionQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'server',
        message: 'Internal server error',
        status: 500,
      }),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useCurrentSessionQuery>)
    saveBulkModerationDraftSelection([activePlace])

    renderProtectedRoute()

    expect(await screen.findByText('Login route')).toBeInTheDocument()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).not.toBeNull()
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
      screen.getByText('Private route for admin@example.test'),
    ).toBeInTheDocument()
  })
})
