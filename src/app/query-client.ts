import { getApiErrorStatus } from '@/shared/api/client/api-error'
import { QueryClient } from '@tanstack/react-query'

/**
 * Единый React Query client приложения с общими retry и cache правилами.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        const status = getApiErrorStatus(error)

        if (status === 401 || status === 403 || status === 404) {
          return false
        }

        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
