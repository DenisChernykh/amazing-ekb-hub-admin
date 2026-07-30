import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement, Suspense } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  authGetMe,
  getAuthGetMeQueryKey,
  getAuthGetMeQueryOptions,
  type CurrentUserResponseDto,
} from '@/shared/api'

import {
  currentSessionQueryKey,
  currentSessionQueryOptions,
  useCurrentSession,
} from './session'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

vi.mock('@/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api')>()

  return {
    ...actual,
    authGetMe: vi.fn(),
  }
})

const currentUser: CurrentUserResponseDto = {
  normalizedEmail: 'admin@example.test',
  permissions: ['admin.dashboard.read'],
  roleKeys: ['admin'],
  userId: 'admin-1',
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Suspense, { fallback: null }, children),
    )
  }
}

describe('current session query contract', () => {
  beforeEach(() => {
    vi.mocked(authGetMe).mockReset()
  })

  it('reuses the generated authGetMe key and query options factories', () => {
    expect(currentSessionQueryKey).toBe(getAuthGetMeQueryKey)
    expect(currentSessionQueryOptions).toBe(getAuthGetMeQueryOptions)
    expect(currentSessionQueryKey()).toEqual(getAuthGetMeQueryKey())
  })

  it('passes the React Query AbortSignal to authGetMe', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.mocked(authGetMe).mockResolvedValue(currentUser)

    const { result } = renderHook(() => useCurrentSession(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(currentUser)
    })

    expect(authGetMe).toHaveBeenCalledWith(undefined, expect.any(AbortSignal))
  })
})
