import type { ApiClientError } from '@/shared/api/client/api-error'
import type {
  ListPlaceMaterialsParams,
  MaterialListResponse,
} from '@/shared/api/generated/operation'
import { useListPlaceMaterials } from '@/shared/api/generated/places/places'
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
 * Загружает материалы места через entity-level bridge.
 *
 * @remarks Сейчас backend предоставляет только публичный read endpoint, поэтому hidden places отключают запрос на уровне widget и показывают явный blocker.
 */
export function usePlaceMaterialsListQuery(
  placeId: string,
  params: ListPlaceMaterialsParams,
  options?: PlaceMaterialsListQueryOptions,
) {
  return useListPlaceMaterials<MaterialListResponse, ApiClientError>(
    { placeId },
    params,
    {
      query: {
        retry: false,
        ...options,
      },
    },
  )
}
