import {
  ApiNetworkError,
  ApiProblemError,
  ApiProtocolError,
} from '@/shared/api/client/api-errors'
import { QueryClient } from '@tanstack/react-query'

/**
 * Определяет, нужно ли повторить неудачный query-запрос к API.
 *
 * @remarks Не повторяет protocol errors и попытки после второй. Повторяет
 * сетевые ошибки и problem responses со статусом `5xx`.
 */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2 || error instanceof ApiProtocolError) {
    return false
  }

  if (error instanceof ApiNetworkError) {
    return true
  }

  return error instanceof ApiProblemError && error.status >= 500
}

/**
 * Единый React Query client приложения с общими retry и cache правилами.
 *
 * @remarks Queries используют `shouldRetryQuery`, сохраняют данные 30 секунд
 * и не перезапрашиваются при возврате фокуса. Mutations не retry автоматически.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
