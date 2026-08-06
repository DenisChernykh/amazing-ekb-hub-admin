import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import { http, HttpResponse } from 'msw'
import { Provider as ReduxProvider } from 'react-redux'
import {
  createMemoryRouter,
  RouterProvider,
  type DataRouter,
} from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppStore } from '@/app/store'
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
  type ProblemCode,
} from '@/shared/api'
import { server } from '@/test/msw/server'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()

  return {
    ...actual,
    createBrowserRouter: vi.fn(),
  }
})

import { createAppRoutes, protectedRouteChildren } from './index'

const currentUser: CurrentUserResponseDto = {
  normalizedEmail: 'admin@example.test',
  permissions: ['admin.dashboard.read'],
  roleKeys: ['admin'],
  userId: 'admin-1',
}

const staleUser: CurrentUserResponseDto = {
  normalizedEmail: 'stale@example.test',
  permissions: [],
  roleKeys: ['content_editor'],
  userId: 'stale-user',
}

const emptyPlacesResponse = {
  items: [],
  page: 1,
  pageSize: 10,
  total: 0,
}

const activeRouters: DataRouter[] = []

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: {
        retry: false,
        staleTime: Number.POSITIVE_INFINITY,
      },
    },
  })
}

function problemResponse(status: number, code: ProblemCode) {
  return HttpResponse.json(
    {
      type: 'https://api.example.test/problems/router-test',
      title: 'Raw backend title',
      status,
      detail: 'Raw backend detail',
      instance: 'urn:request:router-test',
      code,
      requestId: 'request-router-test',
      errors: [
        {
          pointer: '/secret',
          code: 'FIELD_INVALID',
          detail: 'Raw backend field detail',
        },
      ],
    },
    {
      status,
      headers: {
        'Content-Type': 'application/problem+json',
      },
    },
  )
}

function installPlacesHandler() {
  server.use(
    http.get('http://api.test/v1/admin/places', () =>
      HttpResponse.json(emptyPlacesResponse),
    ),
  )
}

function renderAppRoute(
  initialEntry: string,
  queryClient = createTestQueryClient(),
) {
  const router = createMemoryRouter(createAppRoutes(queryClient), {
    initialEntries: [initialEntry],
  })
  activeRouters.push(router)

  render(
    <AntdApp>
      <ReduxProvider store={createAppStore()}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ReduxProvider>
    </AntdApp>,
  )

  return { queryClient, router }
}

describe('application data routes', () => {
  beforeEach(() => {
    clearCsrfToken()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    for (const router of activeRouters.splice(0)) {
      router.dispose()
    }
    clearCsrfToken()
    window.sessionStorage.clear()
  })

  it('keeps the existing admin route set as relative protected children', () => {
    expect(
      protectedRouteChildren.map((route) =>
        route.index === true ? '(index)' : route.path,
      ),
    ).toEqual([
      '(index)',
      'places',
      'categories',
      'collections',
      'collections/:collectionId',
      'materials',
      'content-sources',
      'places/:placeId',
      'places/:placeId/edit',
      'places/new',
      'places/import/yandex',
      'places/import/yandex/:operationId',
      '*',
    ])
  })

  it('loads a fresh protected session, renders the route, and seeds the session cache', async () => {
    let authRequestCount = 0
    server.use(
      http.get('http://api.test/v1/auth/me', () => {
        authRequestCount += 1
        return HttpResponse.json(currentUser)
      }),
    )
    installPlacesHandler()
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(currentSessionQueryKey(), staleUser)

    const { router } = renderAppRoute('/places?status=hidden', queryClient)

    expect(
      await screen.findByRole('heading', { name: 'Места' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/places')
    expect(router.state.location.search).toBe('?status=hidden')
    expect(queryClient.getQueryData(currentSessionQueryKey())).toEqual(
      currentUser,
    )
    expect(authRequestCount).toBe(1)
  })

  it('redirects an anonymous protected request and clears session, CSRF, and draft state', async () => {
    server.use(
      http.get('http://api.test/v1/auth/me', () =>
        problemResponse(401, 'AUTHENTICATION_REQUIRED'),
      ),
    )
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(currentSessionQueryKey(), staleUser)
    setCsrfToken('csrf-before-session-loss')
    saveBulkModerationDraftSelection([
      {
        id: 'place-1',
        status: 'hidden',
        title: 'Скрытое место',
      },
    ])

    const { router } = renderAppRoute('/places?status=hidden', queryClient)

    expect(
      await screen.findByRole('heading', {
        name: 'Amazing EKB Hub Admin',
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe(
      '?returnTo=%2Fplaces%3Fstatus%3Dhidden',
    )
    expect(queryClient.getQueryData(currentSessionQueryKey())).toBeUndefined()
    expect(peekCsrfToken()).toBeNull()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
    expect(screen.queryByText('Raw backend title')).not.toBeInTheDocument()
    expect(screen.queryByText('Raw backend detail')).not.toBeInTheDocument()
  })

  it('renders a safe forbidden route error without treating permission denial as logout', async () => {
    server.use(
      http.get('http://api.test/v1/auth/me', () =>
        problemResponse(403, 'AUTHORIZATION_DENIED'),
      ),
    )
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(currentSessionQueryKey(), staleUser)
    setCsrfToken('csrf-before-forbidden')
    saveBulkModerationDraftSelection([
      {
        id: 'place-1',
        status: 'hidden',
        title: 'Скрытое место',
      },
    ])

    const { router } = renderAppRoute('/places', queryClient)

    expect(
      await screen.findByText('Недостаточно прав для открытия страницы.'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/places')
    expect(queryClient.getQueryData(currentSessionQueryKey())).toEqual(
      staleUser,
    )
    expect(peekCsrfToken()).toBe('csrf-before-forbidden')
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).not.toBeNull()
    expect(screen.queryByText('Raw backend title')).not.toBeInTheDocument()
    expect(screen.queryByText('Raw backend detail')).not.toBeInTheDocument()
  })

  it.each([
    ['network', () => HttpResponse.error()],
    ['503 Problem Details', () => problemResponse(503, 'INTERNAL_ERROR')],
  ])(
    'keeps a protected %s failure on the route as a retryable safe error',
    async (_label, response) => {
      server.use(http.get('http://api.test/v1/auth/me', () => response()))

      const { router } = renderAppRoute('/places')

      expect(
        await screen.findByRole('button', { name: 'Повторить' }),
      ).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/places')
      expect(screen.queryByText('Raw backend title')).not.toBeInTheDocument()
      expect(screen.queryByText('Raw backend detail')).not.toBeInTheDocument()
    },
  )

  it('redirects an authenticated login route to its sanitized return path', async () => {
    server.use(
      http.get('http://api.test/v1/auth/me', () =>
        HttpResponse.json(currentUser),
      ),
    )
    installPlacesHandler()

    const { router } = renderAppRoute('/login?returnTo=%2Fplaces')

    expect(
      await screen.findByRole('heading', { name: 'Места' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/places')
  })

  it('keeps an unauthenticated user on the login route', async () => {
    server.use(
      http.get('http://api.test/v1/auth/me', () =>
        problemResponse(401, 'AUTHENTICATION_REQUIRED'),
      ),
    )

    const { router } = renderAppRoute('/login')

    expect(
      await screen.findByRole('heading', {
        name: 'Amazing EKB Hub Admin',
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.queryByText('Raw backend title')).not.toBeInTheDocument()
    expect(screen.queryByText('Raw backend detail')).not.toBeInTheDocument()
  })

  it('does not write a stale session after protected navigation is aborted', async () => {
    let authRequestCount = 0
    let releaseProtectedResponse = () => {}
    let markProtectedRequestStarted = () => {}
    const protectedRequestStarted = new Promise<void>((resolve) => {
      markProtectedRequestStarted = resolve
    })
    const protectedResponseRelease = new Promise<void>((resolve) => {
      releaseProtectedResponse = resolve
    })

    server.use(
      http.get('http://api.test/v1/auth/me', async () => {
        authRequestCount += 1

        if (authRequestCount === 1) {
          markProtectedRequestStarted()
          await protectedResponseRelease
          return HttpResponse.json(staleUser)
        }

        return problemResponse(401, 'AUTHENTICATION_REQUIRED')
      }),
    )
    const { queryClient, router } = renderAppRoute('/places')
    await protectedRequestStarted

    await act(async () => {
      const navigation = router.navigate('/login')
      releaseProtectedResponse()
      await navigation
    })

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
    expect(queryClient.getQueryData(currentSessionQueryKey())).toBeUndefined()
  })
})
