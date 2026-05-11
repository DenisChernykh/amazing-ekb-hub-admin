import { getGetCurrentUserQueryKey } from '@/shared/api/generated/auth/auth'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Возвращает React Query key текущей backend-сессии.
 */
export const getCurrentSessionQueryKey = getGetCurrentUserQueryKey

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
