import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  getListAdminPlaceMaterialsQueryKey,
  listAdminPlaceMaterials,
} from '@/shared/api/generated/admin/admin'
import type { MaterialListResponse } from '@/shared/api/generated/operation'
import type { ListAdminPlaceMaterialsParams } from '@/shared/api/generated/operation/listAdminPlaceMaterialsParams'
import { useQuery } from '@tanstack/react-query'

/**
 * Загружает admin-список материалов места через entity-level hook.
 *
 * @remarks Использует generated fetcher и query key; материалы доступны и для
 * `active`, и для `hidden` places.
 */
export function usePlaceMaterialsListQuery(
  placeId: string,
  params?: ListAdminPlaceMaterialsParams,
) {
  return useQuery<MaterialListResponse, ApiClientError>({
    enabled: Boolean(placeId),
    queryFn: ({ signal }) =>
      listAdminPlaceMaterials({ placeId }, params, undefined, signal),
    queryKey: getListAdminPlaceMaterialsQueryKey({ placeId }, params),
  })
}
