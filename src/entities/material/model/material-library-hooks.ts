import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  getListAdminMaterialLibraryQueryKey,
  listAdminMaterialLibrary,
} from '@/shared/api/generated/admin/admin'
import type { AdminMaterialLibraryListResponse } from '@/shared/api/generated/operation/adminMaterialLibraryListResponse'
import type { ListAdminMaterialLibraryParams } from '@/shared/api/generated/operation/listAdminMaterialLibraryParams'
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
  params?: ListAdminMaterialLibraryParams,
  options?: MaterialLibraryQueryOptions,
) {
  return useQuery<AdminMaterialLibraryListResponse, ApiClientError>({
    enabled: options?.enabled,
    queryFn: ({ signal }) =>
      listAdminMaterialLibrary(params, undefined, signal),
    queryKey: getListAdminMaterialLibraryQueryKey(params),
  })
}
