import { useSuspenseQuery } from '@tanstack/react-query'

import {
  authGetMe,
  getAuthGetMeQueryKey,
  getAuthGetMeQueryOptions,
} from '@/shared/api'

/**
 * Создаёт ключ кеша текущей backend-сессии.
 *
 * @remarks Один ключ используют session hooks, route guard и cache helpers.
 */
export const currentSessionQueryKey = getAuthGetMeQueryKey

/**
 * Создаёт параметры запроса текущей backend-сессии.
 *
 * @remarks Сохраняет generated transport contract без прямого использования
 * generated hooks в UI.
 */
export const currentSessionQueryOptions = getAuthGetMeQueryOptions

/**
 * Возвращает текущую backend-сессию из React Query.
 *
 * @remarks Требует `QueryClientProvider`, использует suspense query и
 * предназначен для UI внутри уже защищённого маршрута.
 *
 * @returns Suspense query с DTO текущей backend-сессии.
 */
export function useCurrentSession() {
  return useSuspenseQuery({
    ...currentSessionQueryOptions(),
    queryFn: ({ signal }) => authGetMe(undefined, signal),
  })
}
