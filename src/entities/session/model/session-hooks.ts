import {
  invalidateCurrentSession,
  removeCurrentSession,
} from '@/entities/session/api/session-api'
import type {
  CurrentUserResponseDto,
  LoginRequestDto,
  LoginResponseDto,
} from '@/shared/api'
import {
  authGetMe,
  authLogin,
  authLogout,
  getAuthGetMeQueryKey,
} from '@/shared/api'
import type { ApiClientError } from '@/shared/api/client/api-error'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type LoginSessionOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (response: LoginResponseDto) => Promise<void> | void
}

type LogoutSessionOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: () => Promise<void> | void
}

/**
 * Загружает текущую cookie-сессию и отключает retry для auth guard сценариев.
 */
export function useCurrentSessionQuery() {
  return useQuery<CurrentUserResponseDto, ApiClientError>({
    queryFn: ({ signal }) => authGetMe(undefined, signal),
    queryKey: getAuthGetMeQueryKey(),
    retry: false,
  })
}

/**
 * Выполняет authLogin через session entity и инвалидирует текущую сессию после успеха.
 */
export function useLoginSession(options?: LoginSessionOptions) {
  const queryClient = useQueryClient()

  return useMutation<
    LoginResponseDto,
    ApiClientError,
    { data: LoginRequestDto }
  >({
    mutationFn: ({ data }) => authLogin(data),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (session) => {
      await invalidateCurrentSession(queryClient)
      await options?.onSuccess?.(session)
    },
  })
}

/**
 * Выполняет authLogout через session entity и очищает кеш текущей сессии после успеха.
 */
export function useLogoutSession(options?: LogoutSessionOptions) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiClientError>({
    mutationFn: () => authLogout(),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async () => {
      removeCurrentSession(queryClient)
      await options?.onSuccess?.()
    },
  })
}
