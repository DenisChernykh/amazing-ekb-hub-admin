import type { CurrentUserResponseDto, LoginResponseDto } from '@/shared/api'
import {
  authGetMe,
  authLogin,
  authLogout,
  getAuthGetMeQueryKey,
} from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCurrentSessionQuery,
  useLoginSession,
  useLogoutSession,
} from './session-hooks'

vi.mock('@/shared/api', () => ({
  authGetMe: vi.fn(),
  getAuthGetMeQueryKey: vi.fn(() => ['/v1/auth/me']),
  authLogin: vi.fn(),
  authLogout: vi.fn(),
}))

const mockedGetCurrentUser = vi.mocked(authGetMe)
const mockedLogin = vi.mocked(authLogin)
const mockedLogout = vi.mocked(authLogout)

const admin: CurrentUserResponseDto = {
  normalizedEmail: 'admin@example.test',
  permissions: ['admin.dashboard.read'],
  roleKeys: ['admin'],
  userId: 'admin-1',
}

const loginResponse: LoginResponseDto = {
  csrfToken: 'a'.repeat(43),
  session: {
    absoluteExpiresAt: '2026-01-02T00:00:00.000Z',
    publicId: 'a'.repeat(22),
  },
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
    vi.mocked(getAuthGetMeQueryKey).mockReturnValue(['/v1/auth/me'])
  })

  it('loads current session through generated fetcher with retry disabled', async () => {
    const queryClient = createQueryClient()
    mockedGetCurrentUser.mockResolvedValue(admin)

    const { result } = renderHook(() => useCurrentSessionQuery(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getAuthGetMeQueryKey).toHaveBeenCalled()
    expect(mockedGetCurrentUser).toHaveBeenCalledWith(
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(admin)
    expect(
      queryClient.getQueryCache().find({ queryKey: ['/v1/auth/me'] })?.options
        .retry,
    ).toBe(false)
  })

  it('logs in through generated fetcher and invalidates current session', async () => {
    const queryClient = new QueryClient()
    const onSuccess = vi.fn()
    const queryKey = ['/v1/auth/me']
    const credentials = {
      email: 'admin@example.test',
      password: 'unit-test-password',
    }
    queryClient.setQueryData(queryKey, admin)
    mockedLogin.mockResolvedValue(loginResponse)

    const { result } = renderHook(() => useLoginSession({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({ data: credentials })

    expect(mockedLogin).toHaveBeenCalledWith(credentials)
    expect(
      queryClient.getQueryCache().find({ queryKey })?.state.isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(loginResponse)
  })

  it('logs out through generated fetcher and removes current session', async () => {
    const queryClient = new QueryClient()
    const onSuccess = vi.fn()
    const queryKey = ['/v1/auth/me']
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
