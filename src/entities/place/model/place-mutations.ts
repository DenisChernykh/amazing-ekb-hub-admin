import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  clearPinnedMaterial,
  createPlace,
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlacesQueryKey,
  setPinnedMaterial,
  updatePlace,
  updatePlaceStatus,
  uploadPlaceCoverPhoto,
} from '@/shared/api/generated/admin/admin'
import type {
  CreatePlaceRequest,
  PlaceDetail,
  PlacePhotoUploadRequest,
  PlaceSummary,
  SetPinnedMaterialRequest,
  UpdatePlaceRequest,
  UpdatePlaceStatusRequest,
} from '@/shared/api/generated/model'
import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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
 * Callback-и для снятия закрепленного материала через entity bridge.
 */
export type ClearPinnedMaterialMutationOptions = {
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

  return useMutation<
    PlaceSummary,
    ApiClientError,
    { data: CreatePlaceRequest }
  >({
    mutationFn: ({ data }) => createPlace(data),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (place) => {
      await invalidatePlacesListQueries(queryClient)
      await options?.onSuccess?.(place)
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

  return useMutation<
    PlaceSummary,
    ApiClientError,
    {
      data: UpdatePlaceStatusRequest
      pathParams: { placeId: string }
    }
  >({
    mutationFn: ({ data, pathParams }) => updatePlaceStatus(pathParams, data),
    onError: (error) => {
      options?.onError?.(error)
    },
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
  })
}

/**
 * Редактирует поля места через admin API и обновляет admin list/detail кеши.
 *
 * @remarks UI получает только entity-level hook и не импортирует generated admin hooks напрямую.
 */
export function useUpdatePlaceMutation(options?: UpdatePlaceMutationOptions) {
  const queryClient = useQueryClient()

  return useMutation<
    PlaceSummary,
    ApiClientError,
    {
      data: UpdatePlaceRequest
      pathParams: { placeId: string }
    }
  >({
    mutationFn: ({ data, pathParams }) => updatePlace(pathParams, data),
    onError: (error) => {
      options?.onError?.(error)
    },
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

  return useMutation<
    PlaceSummary,
    ApiClientError,
    {
      data: PlacePhotoUploadRequest
      pathParams: { placeId: string }
    }
  >({
    mutationFn: ({ data, pathParams }) =>
      uploadPlaceCoverPhoto(pathParams, data),
    onError: (error) => {
      options?.onError?.(error)
    },
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

  return useMutation<
    PlaceDetail,
    ApiClientError,
    {
      data: SetPinnedMaterialRequest
      pathParams: { placeId: string }
    }
  >({
    mutationFn: ({ data, pathParams }) => setPinnedMaterial(pathParams, data),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (place, variables) => {
      await invalidateAdminPlaceDetailQuery(
        queryClient,
        variables.pathParams.placeId,
      )
      await options?.onSuccess?.(place)
    },
  })
}

/**
 * Снимает закрепленный материал места и обновляет admin detail кеш.
 *
 * @remarks UI получает только entity-level hook. Список мест и список материалов
 * не инвалидируются, потому что clear меняет только detail-состояние pinned material.
 */
export function useClearPinnedMaterialMutation(
  options?: ClearPinnedMaterialMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    PlaceDetail,
    ApiClientError,
    {
      pathParams: { placeId: string }
    }
  >({
    mutationFn: ({ pathParams }) => clearPinnedMaterial(pathParams),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (place, variables) => {
      await invalidateAdminPlaceDetailQuery(
        queryClient,
        variables.pathParams.placeId,
      )
      await options?.onSuccess?.(place)
    },
  })
}
