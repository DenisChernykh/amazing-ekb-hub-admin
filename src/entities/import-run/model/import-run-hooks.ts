import type {
  AdminImportRunsListParams,
  ApiClientError,
  ImportRunListResponseDto,
} from '@/shared/api'
import {
  adminImportRunsList,
  getAdminImportRunsListQueryKey,
} from '@/shared/api'
import { useQuery } from '@tanstack/react-query'

/**
 * Загружает диагностические import runs через entity-level hook.
 *
 * @remarks Использует generated fetcher и query key, чтобы UI не зависел от
 * transport-слоя напрямую.
 */
export function useImportRunsQuery(params?: AdminImportRunsListParams) {
  return useQuery<ImportRunListResponseDto, ApiClientError>({
    queryFn: ({ signal }) => adminImportRunsList(params, undefined, signal),
    queryKey: getAdminImportRunsListQueryKey(params),
  })
}
