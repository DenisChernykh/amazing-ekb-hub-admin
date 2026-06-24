import type { ApiClientError } from '@/shared/api/client/api-error'
import { useListImportRuns } from '@/shared/api/generated/admin/admin'
import type { ImportRunListResponse } from '@/shared/api/generated/operation/importRunListResponse'
import type { ListImportRunsParams } from '@/shared/api/generated/operation/listImportRunsParams'
import type { UseQueryOptions } from '@tanstack/react-query'

/**
 * Безопасные options для запроса import runs без замены query key или query function.
 */
export type ImportRunsQueryOptions = Omit<
  Partial<
    UseQueryOptions<
      ImportRunListResponse,
      ApiClientError,
      ImportRunListResponse
    >
  >,
  'queryFn' | 'queryKey'
>

/**
 * Загружает диагностические import runs через entity-level bridge.
 *
 * @remarks UI получает этот hook вместо generated admin hook, чтобы не зависеть от transport-слоя напрямую.
 */
export function useImportRunsQuery(
  params?: ListImportRunsParams,
  options?: ImportRunsQueryOptions,
) {
  return useListImportRuns<ImportRunListResponse, ApiClientError>(params, {
    query: options,
  })
}
