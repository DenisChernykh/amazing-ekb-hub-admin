import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  cancelPlaceImport,
  confirmPlaceImport,
  createPlaceImportViewerAccess,
  revokePlaceImportViewerAccess,
  startYandexMapsPlaceImport,
} from '@/shared/api/generated/admin/admin'
import type {
  PlaceImportOperation,
  PlaceImportViewerAccess,
  StartPlaceImportRequest,
} from '@/shared/api/generated/model'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  invalidatePlaceImportResultQueries,
  syncPlaceImportOperationCache,
} from './place-import-cache'

/** Общие callbacks operation mutation. */
export type PlaceImportMutationOptions<TData> = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (data: TData) => Promise<void> | void
}

/** Запускает новую durable operation импорта. */
export function useStartPlaceImportMutation(
  options?: PlaceImportMutationOptions<PlaceImportOperation>,
) {
  const queryClient = useQueryClient()
  return useMutation<
    PlaceImportOperation,
    ApiClientError,
    StartPlaceImportRequest
  >({
    mutationFn: (request) => startYandexMapsPlaceImport(request),
    onError: options?.onError,
    onSuccess: async (operation) => {
      syncPlaceImportOperationCache(queryClient, operation)
      await options?.onSuccess?.(operation)
    },
  })
}

/** Подтверждает immutable preview и синхронизирует caches результата. */
export function useConfirmPlaceImportMutation(
  options?: PlaceImportMutationOptions<PlaceImportOperation>,
) {
  const queryClient = useQueryClient()
  return useMutation<PlaceImportOperation, ApiClientError, string>({
    mutationFn: (operationId) => confirmPlaceImport({ operationId }),
    onError: options?.onError,
    onSuccess: async (operation) => {
      syncPlaceImportOperationCache(queryClient, operation)
      await invalidatePlaceImportResultQueries(queryClient)
      await options?.onSuccess?.(operation)
    },
  })
}

/** Отменяет operation и сохраняет terminal snapshot. */
export function useCancelPlaceImportMutation(
  options?: PlaceImportMutationOptions<PlaceImportOperation>,
) {
  const queryClient = useQueryClient()
  return useMutation<PlaceImportOperation, ApiClientError, string>({
    mutationFn: (operationId) => cancelPlaceImport({ operationId }),
    onError: options?.onError,
    onSuccess: async (operation) => {
      syncPlaceImportOperationCache(queryClient, operation)
      await options?.onSuccess?.(operation)
    },
  })
}

/** Выдаёт одноразовый viewer capability для CAPTCHA popup. */
export function useCreatePlaceImportViewerAccessMutation(
  options?: PlaceImportMutationOptions<PlaceImportViewerAccess>,
) {
  return useMutation<PlaceImportViewerAccess, ApiClientError, string>({
    mutationFn: (operationId) => createPlaceImportViewerAccess({ operationId }),
    onError: options?.onError,
    onSuccess: options?.onSuccess,
  })
}

/** Отзывает viewer capability и активную CAPTCHA session. */
export function useRevokePlaceImportViewerAccessMutation(
  options?: PlaceImportMutationOptions<void>,
) {
  return useMutation<void, ApiClientError, string>({
    mutationFn: (operationId) => revokePlaceImportViewerAccess({ operationId }),
    onError: options?.onError,
    onSuccess: options?.onSuccess,
  })
}
