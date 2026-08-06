import type {
  PlaceImportOperationResponseDto,
  PlaceImportOperationResponseDtoStatus,
} from '@/shared/api'
import {
  getAdminCategoriesListQueryKey,
  getAdminCollectionsGetQueryKey,
  getAdminCollectionsListQueryKey,
  getAdminPlaceImportsGetQueryKey,
  getAdminPlacesListQueryKey,
} from '@/shared/api'
import type { QueryClient } from '@tanstack/react-query'

/** Terminal statuses после которых realtime-каналы операции больше не нужны. */
export const PLACE_IMPORT_TERMINAL_STATUSES = [
  'completed',
  'failed',
  'expired',
  'cancelled',
] as const satisfies readonly PlaceImportOperationResponseDtoStatus[]

const terminalStatusSet: ReadonlySet<PlaceImportOperationResponseDtoStatus> =
  new Set(PLACE_IMPORT_TERMINAL_STATUSES)

/** Проверяет, завершилась ли операция импорта без дальнейших server transitions. */
export function isTerminalPlaceImportStatus(
  status: PlaceImportOperationResponseDtoStatus,
) {
  return terminalStatusSet.has(status)
}

/** Записывает authoritative snapshot операции в React Query cache. */
export function syncPlaceImportOperationCache(
  queryClient: QueryClient,
  operation: PlaceImportOperationResponseDto,
) {
  queryClient.setQueryData(
    getAdminPlaceImportsGetQueryKey({ operationId: operation.id }),
    (current: PlaceImportOperationResponseDto | undefined) =>
      current && current.version > operation.version ? current : operation,
  )
}

/** Инвалидирует места и категории после terminal успешного импорта. */
export function invalidatePlaceImportResultQueries(
  queryClient: QueryClient,
  operation?: PlaceImportOperationResponseDto,
) {
  const queries = [
    queryClient.invalidateQueries({ queryKey: getAdminPlacesListQueryKey() }),
    queryClient.invalidateQueries({
      queryKey: getAdminCategoriesListQueryKey(),
    }),
  ]
  if (operation?.targetCollection?.id) {
    queries.push(
      queryClient.invalidateQueries({
        queryKey: getAdminCollectionsListQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getAdminCollectionsGetQueryKey({
          collectionId: operation.targetCollection.id,
        }),
      }),
    )
  }
  return Promise.all(queries)
}
