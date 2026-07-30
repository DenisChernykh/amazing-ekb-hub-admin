import { currentSessionQueryOptions } from '@/entities/session'
import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import type {
  AdminPlaceSummaryResponseDto,
  PlaceCategoryResponseDto,
} from '@/shared/api'
import { createApiProblemError } from '@/test/api-problem'
import { useQuery } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireAuth } from './require-auth'

vi.mock('@/entities/session', () => ({
  currentSessionQueryOptions: vi.fn(() => ({
    queryKey: ['/v1/auth/me'],
  })),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

const mockedUseQuery = vi.mocked(useQuery)

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
  return <div>Private route</div>
}

function LoginRouteProbe() {
  const location = useLocation()

  return <div>Login route {location.search}</div>
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
        element: <LoginRouteProbe />,
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
    mockedUseQuery.mockReset()
    vi.mocked(currentSessionQueryOptions).mockClear()
  })

  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('shows a session loading state while current user is pending', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isPending: true,
    } as ReturnType<typeof useQuery>)

    renderProtectedRoute()

    expect(screen.getByText('Проверяем сессию')).toBeInTheDocument()
  })

  it('redirects anonymous users to login route', async () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      error: createApiProblemError('AUTHENTICATION_REQUIRED', 401),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useQuery>)

    renderProtectedRoute()

    expect(
      await screen.findByText('Login route ?returnTo=%2F'),
    ).toBeInTheDocument()
  })

  it('clears bulk moderation draft when the current session is lost', async () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      error: createApiProblemError('AUTHENTICATION_REQUIRED', 401),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useQuery>)
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
    mockedUseQuery.mockReturnValue({
      data: undefined,
      error: createApiProblemError('INTERNAL_ERROR', 500),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useQuery>)
    saveBulkModerationDraftSelection([activePlace])

    renderProtectedRoute()

    expect(
      await screen.findByText('Login route ?returnTo=%2F'),
    ).toBeInTheDocument()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).not.toBeNull()
  })

  it('shows forbidden state for permission errors', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      error: createApiProblemError('AUTHORIZATION_DENIED', 403),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useQuery>)

    renderProtectedRoute()

    expect(screen.getByText('Доступ запрещен')).toBeInTheDocument()
  })

  it('renders the protected outlet after a successful session query', () => {
    mockedUseQuery.mockReturnValue({
      data: {
        normalizedEmail: 'admin@example.test',
        permissions: ['admin.dashboard.read'],
        roleKeys: ['admin'],
        userId: 'admin-1',
      },
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof useQuery>)

    renderProtectedRoute()

    expect(screen.getByText('Private route')).toBeInTheDocument()
  })
})
