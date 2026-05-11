import {
  invalidateCurrentSession,
  removeCurrentSession,
} from '@/entities/session/api/session-api'
import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  useGetCurrentUser,
  useLogin,
  useLogout,
} from '@/shared/api/generated/auth/auth'
import type { AuthMeResponse } from '@/shared/api/generated/model'
import type { UseQueryOptions } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Безопасные options для запроса текущей сессии без возможности заменить query key или query function.
 */
export type CurrentSessionQueryOptions = Omit<
  Partial<UseQueryOptions<AuthMeResponse, ApiClientError, AuthMeResponse>>,
  'queryFn' | 'queryKey'
>

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
export function useCurrentSessionQuery(options?: CurrentSessionQueryOptions) {
  return useGetCurrentUser({
    query: {
      retry: false,
      ...options,
    },
  })
}

/**
 * Выполняет login через session entity и инвалидирует текущую сессию после успеха.
 */
export function useLoginSession(options?: LoginSessionOptions) {
  const queryClient = useQueryClient()

  return useLogin({
    mutation: {
      onError: options?.onError,
      onSuccess: async (session) => {
        await invalidateCurrentSession(queryClient)
        await options?.onSuccess?.(session)
      },
    },
  })
}

/**
 * Выполняет logout через session entity и очищает кеш текущей сессии после успеха.
 */
export function useLogoutSession(options?: LogoutSessionOptions) {
  const queryClient = useQueryClient()

  return useLogout({
    mutation: {
      onError: options?.onError,
      onSuccess: async () => {
        removeCurrentSession(queryClient)
        await options?.onSuccess?.()
      },
    },
  })
}
