import type { QueryClient } from '@tanstack/react-query'
import { createMemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { currentSessionQueryKey } from '@/entities/session'
import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import {
  ApiNetworkError,
  ApiProtocolError,
  clearCsrfToken,
  getAdminPlacesListQueryKey,
  peekCsrfToken,
  setCsrfToken,
  type CurrentUserResponseDto,
} from '@/shared/api'
import { createApiProblemError } from '@/test/api-problem'

import { createAppRuntime } from './app-runtime'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

const currentUser: CurrentUserResponseDto = {
  normalizedEmail: 'admin@example.test',
  permissions: ['admin.dashboard.read'],
  roleKeys: ['admin'],
  userId: 'admin-1',
}

function createTestRuntime(initialEntry: string) {
  return createAppRuntime(() =>
    createMemoryRouter(
      [
        { path: '/login', element: null },
        { path: '*', element: null },
      ],
      { initialEntries: [initialEntry] },
    ),
  )
}

function seedAuthenticatedState(queryClient: QueryClient) {
  queryClient.setQueryData(currentSessionQueryKey(), currentUser)
  setCsrfToken('csrf-before-auth-loss')
  saveBulkModerationDraftSelection([
    { id: 'place-1', status: 'hidden', title: 'Скрытое место' },
  ])
}

async function runProductQuery(queryClient: QueryClient, error: unknown) {
  return queryClient.fetchQuery({
    queryKey: getAdminPlacesListQueryKey(),
    queryFn: () => Promise.reject(error),
    retry: false,
  })
}

async function runProductMutation(queryClient: QueryClient, error: unknown) {
  const mutation = queryClient.getMutationCache().build(queryClient, {
    mutationFn: () => Promise.reject(error),
  })

  return mutation.execute(undefined)
}

function expectAuthenticatedStatePreserved(queryClient: QueryClient) {
  expect(queryClient.getQueryData(currentSessionQueryKey())).toEqual(
    currentUser,
  )
  expect(peekCsrfToken()).toBe('csrf-before-auth-loss')
  expect(
    window.sessionStorage.getItem(BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY),
  ).not.toBeNull()
}

describe('app runtime authentication-loss boundary', () => {
  beforeEach(() => {
    clearCsrfToken()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    clearCsrfToken()
    window.sessionStorage.clear()
  })

  it('cleans auth state and redirects a failed product mutation with the full protected return target', async () => {
    const { queryClient, router } = createTestRuntime(
      '/places?status=hidden#place-1',
    )
    seedAuthenticatedState(queryClient)
    const error = createApiProblemError('AUTHENTICATION_REQUIRED', 401)

    await expect(runProductMutation(queryClient, error)).rejects.toBe(error)

    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe(
      '?returnTo=%2Fplaces%3Fstatus%3Dhidden%23place-1',
    )
    expect(queryClient.getQueryData(currentSessionQueryKey())).toBeUndefined()
    expect(peekCsrfToken()).toBeNull()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
  })

  it('cleans auth state and redirects a failed product query', async () => {
    const { queryClient, router } = createTestRuntime('/materials')
    seedAuthenticatedState(queryClient)
    const error = createApiProblemError('AUTHENTICATION_REQUIRED', 401)

    await expect(runProductQuery(queryClient, error)).rejects.toBe(error)

    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?returnTo=%2Fmaterials')
    expect(queryClient.getQueryData(currentSessionQueryKey())).toBeUndefined()
    expect(peekCsrfToken()).toBeNull()
  })

  it('cleans auth state without navigating again from the login route', async () => {
    const { queryClient, router } = createTestRuntime(
      '/login?reason=expired#retry',
    )
    seedAuthenticatedState(queryClient)
    const error = createApiProblemError('AUTHENTICATION_REQUIRED', 401)

    await expect(runProductQuery(queryClient, error)).rejects.toBe(error)

    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?reason=expired')
    expect(router.state.location.hash).toBe('#retry')
    expect(queryClient.getQueryData(currentSessionQueryKey())).toBeUndefined()
    expect(peekCsrfToken()).toBeNull()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
  })

  it.each([
    [
      'authorization denial',
      createApiProblemError('AUTHORIZATION_DENIED', 403),
    ],
    ['network error', new ApiNetworkError()],
    ['protocol error', new ApiProtocolError()],
    ['other problem', createApiProblemError('INTERNAL_ERROR', 500)],
  ])(
    'preserves auth state and route for a product query %s',
    async (_label, error) => {
      const { queryClient, router } = createTestRuntime('/places')
      seedAuthenticatedState(queryClient)

      await expect(runProductQuery(queryClient, error)).rejects.toBe(error)

      expect(router.state.location.pathname).toBe('/places')
      expect(router.state.location.search).toBe('')
      expectAuthenticatedStatePreserved(queryClient)
    },
  )

  it('preserves auth state and route for a product mutation authorization denial', async () => {
    const { queryClient, router } = createTestRuntime('/places')
    seedAuthenticatedState(queryClient)
    const error = createApiProblemError('AUTHORIZATION_DENIED', 403)

    await expect(runProductMutation(queryClient, error)).rejects.toBe(error)

    expect(router.state.location.pathname).toBe('/places')
    expectAuthenticatedStatePreserved(queryClient)
  })
})
