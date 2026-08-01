import type {
  AdminMaterialLibraryListResponseDto,
  AdminMaterialsListParams,
  ApiClientError,
} from '@/shared/api'
import { adminMaterialsList, getAdminMaterialsListQueryKey } from '@/shared/api'
import { useQuery } from '@tanstack/react-query'

type MaterialLibraryQueryOptions = {
  enabled?: boolean
}

/**
 * Загружает административную библиотеку материалов через entity-level hook.
 *
 * @remarks Использует generated fetcher и query key; из options поддерживает
 * только `enabled` для ленивых drawer-сценариев.
 */
export function useMaterialLibraryQuery(
  params?: AdminMaterialsListParams,
  options?: MaterialLibraryQueryOptions,
) {
  return useQuery<AdminMaterialLibraryListResponseDto, ApiClientError>({
    enabled: options?.enabled,
    queryFn: ({ signal }) => adminMaterialsList(params, undefined, signal),
    queryKey: getAdminMaterialsListQueryKey(params),
  })
}
