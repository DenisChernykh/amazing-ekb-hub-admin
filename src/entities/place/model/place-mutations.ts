import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlacesQueryKey,
  useCreatePlace,
  useUpdatePlaceStatus,
} from '@/shared/api/generated/admin/admin'
import type { PlaceSummary } from '@/shared/api/generated/model'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Callback-и для создания места через entity bridge.
 */
export type CreatePlaceMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceSummary) => Promise<void> | void
}

/**
 * Callback-и для смены статуса места через entity bridge.
 */
export type UpdatePlaceStatusMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceSummary) => Promise<void> | void
}

/**
 * Инвалидирует все варианты административного списка мест после admin-мутаций.
 */
export const invalidatePlacesListQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getListAdminPlacesQueryKey(),
  })
}

/**
 * Инвалидирует административную detail-карточку места после admin-мутаций.
 */
export const invalidateAdminPlaceDetailQuery = (
  queryClient: QueryClient,
  placeId: string,
) => {
  return queryClient.invalidateQueries({
    queryKey: getGetAdminPlaceDetailQueryKey({ placeId }),
  })
}

/**
 * Создает место через admin API и обновляет кеш списка мест после успеха.
 *
 * @remarks UI получает только entity-level hook и не импортирует generated admin hooks напрямую.
 */
export function useCreatePlaceMutation(options?: CreatePlaceMutationOptions) {
  const queryClient = useQueryClient()

  return useCreatePlace<ApiClientError>({
    mutation: {
      onError: options?.onError,
      onSuccess: async (place) => {
        await invalidatePlacesListQueries(queryClient)
        await options?.onSuccess?.(place)
      },
    },
  })
}

/**
 * Меняет статус публикации места через admin API и обновляет admin list/detail кеши.
 *
 * @remarks UI получает только entity-level hook и не импортирует generated admin hooks напрямую.
 */
export function useUpdatePlaceStatusMutation(
  options?: UpdatePlaceStatusMutationOptions,
) {
  const queryClient = useQueryClient()

  return useUpdatePlaceStatus<ApiClientError>({
    mutation: {
      onError: options?.onError,
      onSuccess: async (place, variables) => {
        await Promise.all([
          invalidatePlacesListQueries(queryClient),
          invalidateAdminPlaceDetailQuery(
            queryClient,
            variables.pathParams.placeId,
          ),
        ])
        await options?.onSuccess?.(place)
      },
    },
  })
}
