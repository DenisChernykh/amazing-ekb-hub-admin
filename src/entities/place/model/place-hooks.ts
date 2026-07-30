import type {
  AdminPlaceListResponseDto,
  AdminPlacesListParams,
  PlaceDetailResponseDto,
} from '@/shared/api'
import {
  adminPlacesGet,
  adminPlacesList,
  getAdminPlacesGetQueryKey,
  getAdminPlacesListQueryKey,
} from '@/shared/api'
import type { ApiClientError } from '@/shared/api/client/api-errors'
import { useQuery } from '@tanstack/react-query'

/**
 * Загружает административный список мест для admin таблицы.
 *
 * @remarks Использует generated fetcher и query key, чтобы UI не импортировал
 * transport-слой напрямую и список мог показывать `hidden` places.
 */
export function usePlacesListQuery(params: AdminPlacesListParams) {
  return useQuery<AdminPlaceListResponseDto, ApiClientError>({
    queryFn: ({ signal }) => adminPlacesList(params, undefined, signal),
    queryKey: getAdminPlacesListQueryKey(params),
  })
}

/**
 * Загружает административную detail-карточку места независимо от публичного статуса.
 *
 * @remarks Использует generated fetcher и query key внутри entity-level hook.
 */
export function useAdminPlaceDetailQuery(placeId: string) {
  return useQuery<PlaceDetailResponseDto, ApiClientError>({
    enabled: Boolean(placeId),
    queryFn: ({ signal }) => adminPlacesGet({ placeId }, undefined, signal),
    queryKey: getAdminPlacesGetQueryKey({ placeId }),
  })
}
