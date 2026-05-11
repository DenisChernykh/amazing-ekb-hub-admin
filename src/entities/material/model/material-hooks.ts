import type { ApiClientError } from '@/shared/api/client/api-error'
import { useListAdminPlaceMaterials } from '@/shared/api/generated/admin/admin'
import type { MaterialListResponse } from '@/shared/api/generated/operation'
import type { ListAdminPlaceMaterialsParams } from '@/shared/api/generated/operation/listAdminPlaceMaterialsParams'
import type { UseQueryOptions } from '@tanstack/react-query'

/**
 * Безопасные options для запроса материалов места без возможности заменить query key или query function.
 */
export type PlaceMaterialsListQueryOptions = Omit<
  Partial<
    UseQueryOptions<MaterialListResponse, ApiClientError, MaterialListResponse>
  >,
  'queryFn' | 'queryKey'
>

/**
 * Загружает admin-список материалов места через entity-level bridge.
 *
 * @remarks Использует admin endpoint, поэтому материалы доступны и для `active`, и для `hidden` places.
 */
export function usePlaceMaterialsListQuery(
  placeId: string,
  params?: ListAdminPlaceMaterialsParams,
  options?: PlaceMaterialsListQueryOptions,
) {
  return useListAdminPlaceMaterials<MaterialListResponse, ApiClientError>(
    { placeId },
    params,
    {
      query: options,
    },
  )
}
