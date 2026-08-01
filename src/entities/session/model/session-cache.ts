import type { QueryClient } from '@tanstack/react-query'

import { clearCsrfToken } from '@/shared/api'

import {
  currentSessionQueryKey,
  currentSessionQueryOptions,
} from '../api/session'

/**
 * Принудительно обновляет текущую backend-сессию.
 *
 * @remarks Сначала инвалидирует единый session key, затем дожидается свежего
 * ответа через generated query options.
 *
 * @returns Актуальный DTO текущей сессии.
 */
export async function refreshCurrentSession(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: currentSessionQueryKey() })
  return queryClient.fetchQuery(currentSessionQueryOptions())
}

/**
 * Удаляет текущую сессию и CSRF-токен из клиентского кеша.
 *
 * @remarks Не трогает feature-owned browser state и не выполняет HTTP-запрос.
 */
export function clearCurrentSession(queryClient: QueryClient) {
  clearCsrfToken()
  queryClient.removeQueries({ queryKey: currentSessionQueryKey() })
}
