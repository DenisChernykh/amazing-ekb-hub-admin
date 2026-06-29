import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  getListImportRunsQueryKey,
  listImportRuns,
} from '@/shared/api/generated/admin/admin'
import type { ImportRunListResponse } from '@/shared/api/generated/operation/importRunListResponse'
import type { ListImportRunsParams } from '@/shared/api/generated/operation/listImportRunsParams'
import { useQuery } from '@tanstack/react-query'

/**
 * Загружает диагностические import runs через entity-level hook.
 *
 * @remarks Использует generated fetcher и query key, чтобы UI не зависел от
 * transport-слоя напрямую.
 */
export function useImportRunsQuery(params?: ListImportRunsParams) {
  return useQuery<ImportRunListResponse, ApiClientError>({
    queryFn: ({ signal }) => listImportRuns(params, undefined, signal),
    queryKey: getListImportRunsQueryKey(params),
  })
}
