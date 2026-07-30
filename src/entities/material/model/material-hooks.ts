import type {
  AdminPlaceMaterialsListParams,
  MaterialListResponseDto,
} from '@/shared/api'
import {
  adminPlaceMaterialsList,
  getAdminPlaceMaterialsListQueryKey,
} from '@/shared/api'
import type { ApiClientError } from '@/shared/api/client/api-error'
import { useQuery } from '@tanstack/react-query'

/**
 * Загружает admin-список материалов места через entity-level hook.
 *
 * @remarks Использует generated fetcher и query key; материалы доступны и для
 * `active`, и для `hidden` places.
 */
export function usePlaceMaterialsListQuery(
  placeId: string,
  params?: AdminPlaceMaterialsListParams,
) {
  return useQuery<MaterialListResponseDto, ApiClientError>({
    enabled: Boolean(placeId),
    queryFn: ({ signal }) =>
      adminPlaceMaterialsList({ placeId }, params, undefined, signal),
    queryKey: getAdminPlaceMaterialsListQueryKey({ placeId }, params),
  })
}
