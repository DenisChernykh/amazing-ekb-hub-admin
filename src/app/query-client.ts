import {
  ApiNetworkError,
  ApiProblemError,
  ApiProtocolError,
  isProblemCode,
} from '@/shared/api'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

type AppQueryClientDependencies = {
  onAuthenticationRequired: () => void
}

const handlesAuthenticationErrorLocally = (
  meta: Record<string, unknown> | undefined,
) => meta?.authenticationErrorHandling === 'local'

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
 * Создаёт React Query client с общими retry и auth-loss правилами приложения.
 *
 * @remarks Queries используют `shouldRetryQuery`, сохраняют данные 30 секунд
 * и не перезапрашиваются при возврате фокуса. Mutations не retry автоматически.
 * Global cache callbacks передают только `AUTHENTICATION_REQUIRED` в
 * app-level session-loss boundary.
 *
 * @returns Изолированный QueryClient для runtime или integration-теста.
 */
export function createAppQueryClient({
  onAuthenticationRequired,
}: AppQueryClientDependencies) {
  const handleError = (error: unknown) => {
    if (isProblemCode(error, 'AUTHENTICATION_REQUIRED')) {
      onAuthenticationRequired()
    }
  }

  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (!handlesAuthenticationErrorLocally(query.meta)) {
          handleError(error)
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        if (!handlesAuthenticationErrorLocally(mutation.meta)) {
          handleError(error)
        }
      },
    }),
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
}
