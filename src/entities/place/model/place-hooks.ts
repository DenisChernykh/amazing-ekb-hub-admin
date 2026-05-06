import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  useGetAdminPlaceDetail,
  useListAdminPlaces,
} from '@/shared/api/generated/admin/admin'
import type {
  ListAdminPlacesParams,
  PlaceDetail,
  PlaceListResponse,
} from '@/shared/api/generated/model'
import type { UseQueryOptions } from '@tanstack/react-query'

/**
 * Безопасные options для запроса списка мест без возможности заменить query key или query function.
 */
export type PlacesListQueryOptions = Omit<
  Partial<
    UseQueryOptions<PlaceListResponse, ApiClientError, PlaceListResponse>
  >,
  'queryFn' | 'queryKey'
>

/**
 * Безопасные options для запроса admin detail места без возможности заменить query key или query function.
 */
export type AdminPlaceDetailQueryOptions = Omit<
  Partial<UseQueryOptions<PlaceDetail, ApiClientError, PlaceDetail>>,
  'queryFn' | 'queryKey'
>

/**
 * Загружает административный список мест для admin таблицы.
 *
 * @remarks Использует admin read endpoint, чтобы список мог показывать `hidden` places.
 */
export function usePlacesListQuery(
  params: ListAdminPlacesParams,
  options?: PlacesListQueryOptions,
) {
  return useListAdminPlaces(params, {
    query: {
      retry: false,
      ...options,
    },
  })
}

/**
 * Загружает административную detail-карточку места независимо от публичного статуса.
 *
 * @remarks UI получает entity-level hook и не импортирует generated admin hooks напрямую.
 */
export function useAdminPlaceDetailQuery(
  placeId: string,
  options?: AdminPlaceDetailQueryOptions,
) {
  return useGetAdminPlaceDetail(
    { placeId },
    {
      query: {
        retry: false,
        ...options,
      },
    },
  )
}
