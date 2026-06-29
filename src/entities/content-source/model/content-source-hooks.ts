import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  getListContentSourcesQueryKey,
  listContentSources,
} from '@/shared/api/generated/admin/admin'
import type { ContentSourceListResponse } from '@/shared/api/generated/operation/contentSourceListResponse'
import type { ListContentSourcesParams } from '@/shared/api/generated/operation/listContentSourcesParams'
import { useQuery } from '@tanstack/react-query'

type ContentSourcesQueryOptions = {
  enabled?: boolean
}

/**
 * Загружает административный список content sources через entity-level hook.
 *
 * @remarks Использует generated fetcher и query key; из options поддерживает
 * только `enabled` для условочной lookup-загрузки.
 */
export function useContentSourcesQuery(
  params?: ListContentSourcesParams,
  options?: ContentSourcesQueryOptions,
) {
  return useQuery<ContentSourceListResponse, ApiClientError>({
    enabled: options?.enabled,
    queryFn: ({ signal }) => listContentSources(params, undefined, signal),
    queryKey: getListContentSourcesQueryKey(params),
  })
}
