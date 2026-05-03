import {
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
  useLogin,
  useLogout,
} from '@/shared/api/generated/auth/auth'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Возвращает React Query key текущей backend-сессии.
 */
export const getCurrentSessionQueryKey = getGetCurrentUserQueryKey

/**
 * Тонкий bridge к generated hook запроса текущего пользователя.
 */
export const useGeneratedCurrentSessionQuery = useGetCurrentUser

/**
 * Тонкий bridge к generated hook входа в систему.
 */
export const useGeneratedLoginSession = useLogin

/**
 * Тонкий bridge к generated hook выхода из системы.
 */
export const useGeneratedLogoutSession = useLogout

/**
 * Инвалидирует кеш текущей сессии после успешного login или refresh.
 */
export const invalidateCurrentSession = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getCurrentSessionQueryKey(),
  })
}

/**
 * Удаляет кеш текущей сессии после logout.
 */
export const removeCurrentSession = (queryClient: QueryClient) => {
  queryClient.removeQueries({
    queryKey: getCurrentSessionQueryKey(),
  })
}
