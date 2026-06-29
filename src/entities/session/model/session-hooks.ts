import {
  invalidateCurrentSession,
  removeCurrentSession,
} from '@/entities/session/api/session-api'
import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  getCurrentUser,
  getGetCurrentUserQueryKey,
  login,
  logout,
} from '@/shared/api/generated/auth/auth'
import type {
  AuthLoginRequest,
  AuthMeResponse,
} from '@/shared/api/generated/model'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type LoginSessionOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (session: AuthMeResponse) => Promise<void> | void
}

type LogoutSessionOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: () => Promise<void> | void
}

/**
 * Загружает текущую cookie-сессию и отключает retry для auth guard сценариев.
 */
export function useCurrentSessionQuery() {
  return useQuery<AuthMeResponse, ApiClientError>({
    queryFn: ({ signal }) => getCurrentUser(undefined, signal),
    queryKey: getGetCurrentUserQueryKey(),
    retry: false,
  })
}

/**
 * Выполняет login через session entity и инвалидирует текущую сессию после успеха.
 */
export function useLoginSession(options?: LoginSessionOptions) {
  const queryClient = useQueryClient()

  return useMutation<
    AuthMeResponse,
    ApiClientError,
    { data: AuthLoginRequest }
  >({
    mutationFn: ({ data }) => login(data),
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
 * Выполняет logout через session entity и очищает кеш текущей сессии после успеха.
 */
export function useLogoutSession(options?: LogoutSessionOptions) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiClientError>({
    mutationFn: () => logout(),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async () => {
      removeCurrentSession(queryClient)
      await options?.onSuccess?.()
    },
  })
}
