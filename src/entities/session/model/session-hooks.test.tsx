import {
  getCurrentUser,
  getGetCurrentUserQueryKey,
  login,
  logout,
} from '@/shared/api/generated/auth/auth'
import type { AuthMeResponse } from '@/shared/api/generated/model'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCurrentSessionQuery,
  useLoginSession,
  useLogoutSession,
} from './session-hooks'

vi.mock('@/shared/api/generated/auth/auth', () => ({
  getCurrentUser: vi.fn(),
  getGetCurrentUserQueryKey: vi.fn(() => ['/auth/me']),
  login: vi.fn(),
  logout: vi.fn(),
  useGetCurrentUser: vi.fn(),
  useLogin: vi.fn(),
  useLogout: vi.fn(),
}))

const mockedGetCurrentUser = vi.mocked(getCurrentUser)
const mockedLogin = vi.mocked(login)
const mockedLogout = vi.mocked(logout)

const admin: AuthMeResponse = {
  email: 'admin@example.test',
  id: 'admin-1',
  role: 'admin',
}

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: true,
      },
    },
  })

describe('session hooks', () => {
  beforeEach(() => {
    mockedGetCurrentUser.mockReset()
    mockedLogin.mockReset()
    mockedLogout.mockReset()
    vi.mocked(getGetCurrentUserQueryKey).mockReturnValue(['/auth/me'])
  })

  it('loads current session through generated fetcher with retry disabled', async () => {
    const queryClient = createQueryClient()
    mockedGetCurrentUser.mockResolvedValue(admin)

    const { result } = renderHook(() => useCurrentSessionQuery(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getGetCurrentUserQueryKey).toHaveBeenCalled()
    expect(mockedGetCurrentUser).toHaveBeenCalledWith(
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(admin)
    expect(
      queryClient.getQueryCache().find({ queryKey: ['/auth/me'] })?.options
        .retry,
    ).toBe(false)
  })

  it('logs in through generated fetcher and invalidates current session', async () => {
    const queryClient = new QueryClient()
    const onSuccess = vi.fn()
    const queryKey = ['/auth/me']
    const credentials = {
      email: 'admin@example.test',
      password: 'unit-test-password',
    }
    queryClient.setQueryData(queryKey, admin)
    mockedLogin.mockResolvedValue(admin)

    const { result } = renderHook(() => useLoginSession({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({ data: credentials })

    expect(mockedLogin).toHaveBeenCalledWith(credentials)
    expect(
      queryClient.getQueryCache().find({ queryKey })?.state.isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(admin)
  })

  it('logs out through generated fetcher and removes current session', async () => {
    const queryClient = new QueryClient()
    const onSuccess = vi.fn()
    const queryKey = ['/auth/me']
    queryClient.setQueryData(queryKey, admin)
    mockedLogout.mockResolvedValue(undefined)

    const { result } = renderHook(() => useLogoutSession({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync()

    expect(mockedLogout).toHaveBeenCalled()
    expect(queryClient.getQueryData(queryKey)).toBeUndefined()
    expect(onSuccess).toHaveBeenCalled()
  })
})
