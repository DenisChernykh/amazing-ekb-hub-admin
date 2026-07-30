import type {
  AdminContentSourcesListParams,
  ContentSourceListResponseDto,
} from '@/shared/api'
import {
  adminContentSourcesList,
  getAdminContentSourcesListQueryKey,
} from '@/shared/api'
import type { ApiClientError } from '@/shared/api/client/api-error'
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
  params?: AdminContentSourcesListParams,
  options?: ContentSourcesQueryOptions,
) {
  return useQuery<ContentSourceListResponseDto, ApiClientError>({
    enabled: options?.enabled,
    queryFn: ({ signal }) => adminContentSourcesList(params, undefined, signal),
    queryKey: getAdminContentSourcesListQueryKey(params),
  })
}
