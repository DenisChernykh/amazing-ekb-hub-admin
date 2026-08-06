import type {
  AdminCollectionSummaryResponseDto,
  AdminCollectionsUploadPhotoBody,
  ApiClientError,
  CreateCollectionDto,
  UpdateCollectionDto,
  UpdateCollectionStatusDto,
} from '@/shared/api'
import {
  adminCollectionsCreate,
  adminCollectionsDelete,
  adminCollectionsRemovePhoto,
  adminCollectionsUpdate,
  adminCollectionsUpdateStatus,
  adminCollectionsUploadPhoto,
} from '@/shared/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  invalidateCollectionListQueries,
  invalidateCollectionQueries,
} from './collection-cache'

/** Общие callbacks для мутаций коллекции. */
export type CollectionMutationOptions<TData> = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (data: TData) => Promise<void> | void
}

/** Создаёт draft-подборку. */
export function useCreateCollectionMutation(
  options?: CollectionMutationOptions<AdminCollectionSummaryResponseDto>,
) {
  const queryClient = useQueryClient()
  return useMutation<
    AdminCollectionSummaryResponseDto,
    ApiClientError,
    CreateCollectionDto
  >({
    mutationFn: (data) => adminCollectionsCreate(data),
    onError: options?.onError,
    onSuccess: async (collection) => {
      await invalidateCollectionListQueries(queryClient)
      await options?.onSuccess?.(collection)
    },
  })
}

/** Обновляет поля коллекции и её зависимые caches. */
export function useUpdateCollectionMutation(
  options?: CollectionMutationOptions<AdminCollectionSummaryResponseDto>,
) {
  const queryClient = useQueryClient()
  return useMutation<
    AdminCollectionSummaryResponseDto,
    ApiClientError,
    { collectionId: string; data: UpdateCollectionDto }
  >({
    mutationFn: ({ collectionId, data }) =>
      adminCollectionsUpdate({ collectionId }, data),
    onError: options?.onError,
    onSuccess: async (collection, variables) => {
      await invalidateCollectionQueries(queryClient, variables.collectionId)
      await options?.onSuccess?.(collection)
    },
  })
}

/** Меняет draft/active status коллекции. */
export function useUpdateCollectionStatusMutation(
  options?: CollectionMutationOptions<AdminCollectionSummaryResponseDto>,
) {
  const queryClient = useQueryClient()
  return useMutation<
    AdminCollectionSummaryResponseDto,
    ApiClientError,
    { collectionId: string; data: UpdateCollectionStatusDto }
  >({
    mutationFn: ({ collectionId, data }) =>
      adminCollectionsUpdateStatus({ collectionId }, data),
    onError: options?.onError,
    onSuccess: async (collection, variables) => {
      await invalidateCollectionQueries(queryClient, variables.collectionId)
      await options?.onSuccess?.(collection)
    },
  })
}

/** Удаляет коллекцию и возвращает список к server-состоянию. */
export function useDeleteCollectionMutation(
  options?: CollectionMutationOptions<void>,
) {
  const queryClient = useQueryClient()
  return useMutation<void, ApiClientError, { collectionId: string }>({
    mutationFn: ({ collectionId }) => adminCollectionsDelete({ collectionId }),
    onError: options?.onError,
    onSuccess: async (_, variables) => {
      await invalidateCollectionQueries(queryClient, variables.collectionId)
      await options?.onSuccess?.()
    },
  })
}

/** Загружает или заменяет cover-фото коллекции. */
export function useUploadCollectionPhotoMutation(
  options?: CollectionMutationOptions<AdminCollectionSummaryResponseDto>,
) {
  const queryClient = useQueryClient()
  return useMutation<
    AdminCollectionSummaryResponseDto,
    ApiClientError,
    { collectionId: string; data: AdminCollectionsUploadPhotoBody }
  >({
    mutationFn: ({ collectionId, data }) =>
      adminCollectionsUploadPhoto({ collectionId }, data),
    onError: options?.onError,
    onSuccess: async (collection, variables) => {
      await invalidateCollectionQueries(queryClient, variables.collectionId)
      await options?.onSuccess?.(collection)
    },
  })
}

/** Полностью удаляет cover-фото коллекции. */
export function useRemoveCollectionPhotoMutation(
  options?: CollectionMutationOptions<void>,
) {
  const queryClient = useQueryClient()
  return useMutation<void, ApiClientError, { collectionId: string }>({
    mutationFn: ({ collectionId }) =>
      adminCollectionsRemovePhoto({ collectionId }),
    onError: options?.onError,
    onSuccess: async (_, variables) => {
      await invalidateCollectionQueries(queryClient, variables.collectionId)
      await options?.onSuccess?.()
    },
  })
}
