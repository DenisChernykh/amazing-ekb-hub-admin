import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  getAdminPlaceDetail,
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlacesQueryKey,
  listAdminPlaces,
} from '@/shared/api/generated/admin/admin'
import type {
  ListAdminPlacesParams,
  PlaceDetail,
  PlaceListResponse,
} from '@/shared/api/generated/model'
import { useQuery } from '@tanstack/react-query'

/**
 * Загружает административный список мест для admin таблицы.
 *
 * @remarks Использует generated fetcher и query key, чтобы UI не импортировал
 * transport-слой напрямую и список мог показывать `hidden` places.
 */
export function usePlacesListQuery(params: ListAdminPlacesParams) {
  return useQuery<PlaceListResponse, ApiClientError>({
    queryFn: ({ signal }) => listAdminPlaces(params, undefined, signal),
    queryKey: getListAdminPlacesQueryKey(params),
  })
}

/**
 * Загружает административную detail-карточку места независимо от публичного статуса.
 *
 * @remarks Использует generated fetcher и query key внутри entity-level hook.
 */
export function useAdminPlaceDetailQuery(placeId: string) {
  return useQuery<PlaceDetail, ApiClientError>({
    enabled: Boolean(placeId),
    queryFn: ({ signal }) =>
      getAdminPlaceDetail({ placeId }, undefined, signal),
    queryKey: getGetAdminPlaceDetailQueryKey({ placeId }),
  })
}
