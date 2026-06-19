import type { ApiClientError } from '@/shared/api/client/api-error'
import { useListContentSources } from '@/shared/api/generated/admin/admin'
import type { ContentSourceListResponse } from '@/shared/api/generated/operation/contentSourceListResponse'
import type { ListContentSourcesParams } from '@/shared/api/generated/operation/listContentSourcesParams'
import type { UseQueryOptions } from '@tanstack/react-query'

/**
 * Безопасные options для запроса content sources без замены query key или query function.
 */
export type ContentSourcesQueryOptions = Omit<
  Partial<
    UseQueryOptions<
      ContentSourceListResponse,
      ApiClientError,
      ContentSourceListResponse
    >
  >,
  'queryFn' | 'queryKey'
>

/**
 * Загружает административный список content sources через entity-level bridge.
 *
 * @remarks UI получает этот hook вместо generated admin hook, чтобы не зависеть от transport-слоя напрямую.
 */
export function useContentSourcesQuery(
  params?: ListContentSourcesParams,
  options?: ContentSourcesQueryOptions,
) {
  return useListContentSources<ContentSourceListResponse, ApiClientError>(
    params,
    {
      query: options,
    },
  )
}
