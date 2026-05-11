import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlacesQueryKey,
  useCreatePlace,
  useSetPinnedMaterial,
  useUpdatePlace,
  useUpdatePlaceStatus,
  useUploadPlaceCoverPhoto,
} from '@/shared/api/generated/admin/admin'
import type { PlaceDetail, PlaceSummary } from '@/shared/api/generated/model'
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
 * Callback-и для редактирования места через entity bridge.
 */
export type UpdatePlaceMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceSummary) => Promise<void> | void
}

/**
 * Callback-и для загрузки cover-фото места через entity bridge.
 */
export type UploadPlaceCoverPhotoMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceSummary) => Promise<void> | void
}

/**
 * Callback-и для назначения закрепленного материала через entity bridge.
 */
export type SetPinnedMaterialMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceDetail) => Promise<void> | void
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

/**
 * Редактирует поля места через admin API и обновляет admin list/detail кеши.
 *
 * @remarks UI получает только entity-level hook и не импортирует generated admin hooks напрямую.
 */
export function useUpdatePlaceMutation(options?: UpdatePlaceMutationOptions) {
  const queryClient = useQueryClient()

  return useUpdatePlace<ApiClientError>({
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

/**
 * Загружает или заменяет cover-фото места и обновляет admin list/detail кеши.
 *
 * @remarks UI получает только entity-level hook и не импортирует generated admin hooks напрямую.
 */
export function useUploadPlaceCoverPhotoMutation(
  options?: UploadPlaceCoverPhotoMutationOptions,
) {
  const queryClient = useQueryClient()

  return useUploadPlaceCoverPhoto<ApiClientError>({
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

/**
 * Назначает закрепленный материал места и обновляет admin detail кеш.
 *
 * @remarks UI получает только entity-level hook. Список мест и список материалов
 * не инвалидируются, потому что текущие контракты не содержат изменяемого pinned state.
 */
export function useSetPinnedMaterialMutation(
  options?: SetPinnedMaterialMutationOptions,
) {
  const queryClient = useQueryClient()

  return useSetPinnedMaterial<ApiClientError>({
    mutation: {
      onError: options?.onError,
      onSuccess: async (place, variables) => {
        await invalidateAdminPlaceDetailQuery(
          queryClient,
          variables.pathParams.placeId,
        )
        await options?.onSuccess?.(place)
      },
    },
  })
}
