import {
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
  useLogin,
  useLogout,
} from '@/shared/api/generated/auth/auth'
import type { AuthMeResponse } from '@/shared/api/generated/model'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCurrentSessionQuery,
  useLoginSession,
  useLogoutSession,
} from './session-hooks'

vi.mock('@/shared/api/generated/auth/auth', async () => {
  const actual = await vi.importActual<
    typeof import('@/shared/api/generated/auth/auth')
  >('@/shared/api/generated/auth/auth')

  return {
    ...actual,
    getGetCurrentUserQueryKey: vi.fn(() => ['/auth/me']),
    useGetCurrentUser: vi.fn(),
    useLogin: vi.fn(),
    useLogout: vi.fn(),
  }
})

const mockedUseGetCurrentUser = vi.mocked(useGetCurrentUser)
const mockedUseLogin = vi.mocked(useLogin)
const mockedUseLogout = vi.mocked(useLogout)

const admin: AuthMeResponse = {
  email: 'admin@amazing-ekb.ru',
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

describe('session hooks', () => {
  beforeEach(() => {
    mockedUseGetCurrentUser.mockReset()
    mockedUseLogin.mockReset()
    mockedUseLogout.mockReset()
    vi.mocked(getGetCurrentUserQueryKey).mockReturnValue(['/auth/me'])
  })

  it('passes safe current session query options with retry disabled by default', () => {
    mockedUseGetCurrentUser.mockReturnValue({
      data: admin,
      isError: false,
      isPending: false,
    } as ReturnType<typeof useGetCurrentUser>)

    renderHook(() =>
      useCurrentSessionQuery({
        refetchOnWindowFocus: false,
        staleTime: 5_000,
      }),
    )

    expect(mockedUseGetCurrentUser).toHaveBeenCalledWith({
      query: {
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: 5_000,
      },
    })
  })

  it('invalidates current session after successful login', async () => {
    const queryClient = new QueryClient()
    const onSuccess = vi.fn()
    const queryKey = ['/auth/me']
    queryClient.setQueryData(queryKey, admin)
    mockedUseLogin.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useLogin>)

    renderHook(() => useLoginSession({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await mockedUseLogin.mock.calls[0]?.[0]?.mutation?.onSuccess?.(
      admin,
      {
        data: {
          email: 'admin@amazing-ekb.ru',
          password: 'supersecret123',
        },
      },
      undefined,
      {} as never,
    )

    expect(
      queryClient.getQueryCache().find({ queryKey })?.state.isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(admin)
  })

  it('removes current session after successful logout', async () => {
    const queryClient = new QueryClient()
    const onSuccess = vi.fn()
    const queryKey = ['/auth/me']
    queryClient.setQueryData(queryKey, admin)
    mockedUseLogout.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useLogout>)

    renderHook(() => useLogoutSession({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await mockedUseLogout.mock.calls[0]?.[0]?.mutation?.onSuccess?.(
      undefined,
      undefined,
      undefined,
      {} as never,
    )

    expect(queryClient.getQueryData(queryKey)).toBeUndefined()
    expect(onSuccess).toHaveBeenCalled()
  })
})
