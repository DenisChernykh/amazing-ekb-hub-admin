import {
  invalidateCollectionDetailQuery,
  invalidateCollectionListQueries,
} from '@/entities/collection/model/collection-cache'
import type {
  AdminPlacesUploadPhotoBody,
  ApiClientError,
  CreatePlaceDto,
  PlaceDetailResponseDto,
  PlaceSummaryResponseDto,
  ReplacePlaceCollectionsDto,
  SetPinnedMaterialDto,
  UpdatePlaceDto,
  UpdatePlaceStatusDto,
} from '@/shared/api'
import {
  adminPlaceCollectionsReplace,
  adminPlacesClearPinnedMaterial,
  adminPlacesCreate,
  adminPlacesSetPinnedMaterial,
  adminPlacesUpdate,
  adminPlacesUpdateStatus,
  adminPlacesUploadPhoto,
  getAdminCategoriesListQueryKey,
  getAdminPlacesGetQueryKey,
  getAdminPlacesListQueryKey,
} from '@/shared/api'
import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Callback-и для создания места через entity bridge.
 */
export type CreatePlaceMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceSummaryResponseDto) => Promise<void> | void
}

/**
 * Callback-и для смены статуса места через entity bridge.
 */
export type UpdatePlaceStatusMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceSummaryResponseDto) => Promise<void> | void
}

/**
 * Callback-и для редактирования места через entity bridge.
 */
export type UpdatePlaceMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceSummaryResponseDto) => Promise<void> | void
}

/**
 * Callback-и для загрузки cover-фото места через entity bridge.
 */
export type UploadPlaceCoverPhotoMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceSummaryResponseDto) => Promise<void> | void
}

/**
 * Callback-и для назначения закрепленного материала через entity bridge.
 */
export type SetPinnedMaterialMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceDetailResponseDto) => Promise<void> | void
}

/**
 * Callback-и для снятия закрепленного материала через entity bridge.
 */
export type ClearPinnedMaterialMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (place: PlaceDetailResponseDto) => Promise<void> | void
}

/** Callback-и для full-set назначения подборок месту. */
export type ReplacePlaceCollectionsMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: () => Promise<void> | void
}

/**
 * Инвалидирует все варианты административного списка мест после admin-мутаций.
 */
export const invalidatePlacesListQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getAdminPlacesListQueryKey(),
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
    queryKey: getAdminPlacesGetQueryKey({ placeId }),
  })
}

/** Инвалидирует категории после публикации места, активирующей draft category. */
export const invalidatePlaceCategoryQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getAdminCategoriesListQueryKey(),
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
    PlaceSummaryResponseDto,
    ApiClientError,
    { data: CreatePlaceDto }
  >({
    mutationFn: ({ data }) => adminPlacesCreate(data),
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
    PlaceSummaryResponseDto,
    ApiClientError,
    {
      data: UpdatePlaceStatusDto
      pathParams: { placeId: string }
    }
  >({
    mutationFn: ({ data, pathParams }) =>
      adminPlacesUpdateStatus(pathParams, data),
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
        ...(variables.data.status === 'active'
          ? [invalidatePlaceCategoryQueries(queryClient)]
          : []),
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
    PlaceSummaryResponseDto,
    ApiClientError,
    {
      data: UpdatePlaceDto
      pathParams: { placeId: string }
    }
  >({
    mutationFn: ({ data, pathParams }) => adminPlacesUpdate(pathParams, data),
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
    PlaceSummaryResponseDto,
    ApiClientError,
    {
      data: AdminPlacesUploadPhotoBody
      pathParams: { placeId: string }
    }
  >({
    mutationFn: ({ data, pathParams }) =>
      adminPlacesUploadPhoto(pathParams, data),
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
    PlaceDetailResponseDto,
    ApiClientError,
    {
      data: SetPinnedMaterialDto
      pathParams: { placeId: string }
    }
  >({
    mutationFn: ({ data, pathParams }) =>
      adminPlacesSetPinnedMaterial(pathParams, data),
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
    PlaceDetailResponseDto,
    ApiClientError,
    {
      pathParams: { placeId: string }
    }
  >({
    mutationFn: ({ pathParams }) => adminPlacesClearPinnedMaterial(pathParams),
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

/** Сохраняет полный набор подборок места и инвалидирует все затронутые details. */
export function useReplacePlaceCollectionsMutation(
  options?: ReplacePlaceCollectionsMutationOptions,
) {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    ApiClientError,
    {
      data: ReplacePlaceCollectionsDto
      pathParams: { placeId: string }
      previousCollectionIds?: string[]
    }
  >({
    mutationFn: ({ data, pathParams }) =>
      adminPlaceCollectionsReplace(pathParams, data),
    onError: options?.onError,
    onSuccess: async (_, variables) => {
      const ids = new Set([
        ...(variables.previousCollectionIds ?? []),
        ...variables.data.collectionIds,
      ])
      await Promise.all([
        invalidatePlacesListQueries(queryClient),
        invalidateAdminPlaceDetailQuery(
          queryClient,
          variables.pathParams.placeId,
        ),
        invalidateCollectionListQueries(queryClient),
        ...Array.from(ids, (collectionId) =>
          invalidateCollectionDetailQuery(queryClient, collectionId),
        ),
      ])
      await options?.onSuccess?.()
    },
  })
}
