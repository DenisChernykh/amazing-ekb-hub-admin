import type { ApiClientError } from '@/shared/api/client/api-error'
import type {
  ListPlacesParams,
  PlaceListResponse,
} from '@/shared/api/generated/model'
import { useListPlaces } from '@/shared/api/generated/places/places'
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
 * Загружает публичный список мест для read-only admin таблицы.
 *
 * @remarks Сейчас backend не предоставляет `GET /admin/places`, поэтому hook возвращает только то, что отдает публичный `GET /places`.
 */
export function usePlacesListQuery(
  params: ListPlacesParams,
  options?: PlacesListQueryOptions,
) {
  return useListPlaces(params, {
    query: {
      retry: false,
      ...options,
    },
  })
}
