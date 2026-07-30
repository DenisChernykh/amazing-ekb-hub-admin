import type {
  PlaceImportOperationResponseDto,
  PlaceImportViewerAccessResponseDto,
  StartPlaceImportDto,
} from '@/shared/api'
import {
  adminPlaceImportsCancel,
  adminPlaceImportsConfirm,
  adminPlaceImportsCreateViewerAccess,
  adminPlaceImportsRevokeViewerAccess,
  adminPlaceImportsStart,
} from '@/shared/api'
import type { ApiClientError } from '@/shared/api/client/api-errors'
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
  options?: PlaceImportMutationOptions<PlaceImportOperationResponseDto>,
) {
  const queryClient = useQueryClient()
  return useMutation<
    PlaceImportOperationResponseDto,
    ApiClientError,
    StartPlaceImportDto
  >({
    mutationFn: (request) => adminPlaceImportsStart(request),
    onError: options?.onError,
    onSuccess: async (operation) => {
      syncPlaceImportOperationCache(queryClient, operation)
      await options?.onSuccess?.(operation)
    },
  })
}

/** Подтверждает immutable preview и синхронизирует caches результата. */
export function useConfirmPlaceImportMutation(
  options?: PlaceImportMutationOptions<PlaceImportOperationResponseDto>,
) {
  const queryClient = useQueryClient()
  return useMutation<PlaceImportOperationResponseDto, ApiClientError, string>({
    mutationFn: (operationId) => adminPlaceImportsConfirm({ operationId }),
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
  options?: PlaceImportMutationOptions<PlaceImportOperationResponseDto>,
) {
  const queryClient = useQueryClient()
  return useMutation<PlaceImportOperationResponseDto, ApiClientError, string>({
    mutationFn: (operationId) => adminPlaceImportsCancel({ operationId }),
    onError: options?.onError,
    onSuccess: async (operation) => {
      syncPlaceImportOperationCache(queryClient, operation)
      await options?.onSuccess?.(operation)
    },
  })
}

/** Выдаёт одноразовый viewer capability для CAPTCHA popup. */
export function useCreatePlaceImportViewerAccessMutation(
  options?: PlaceImportMutationOptions<PlaceImportViewerAccessResponseDto>,
) {
  return useMutation<
    PlaceImportViewerAccessResponseDto,
    ApiClientError,
    string
  >({
    mutationFn: (operationId) =>
      adminPlaceImportsCreateViewerAccess({ operationId }),
    onError: options?.onError,
    onSuccess: options?.onSuccess,
  })
}

/** Отзывает viewer capability и активную CAPTCHA session. */
export function useRevokePlaceImportViewerAccessMutation(
  options?: PlaceImportMutationOptions<void>,
) {
  return useMutation<void, ApiClientError, string>({
    mutationFn: (operationId) =>
      adminPlaceImportsRevokeViewerAccess({ operationId }),
    onError: options?.onError,
    onSuccess: options?.onSuccess,
  })
}
