import {
  getGetPlaceImportOperationQueryKey,
  getListAdminPlaceCategoriesQueryKey,
  getListAdminPlacesQueryKey,
} from '@/shared/api/generated/admin/admin'
import type {
  PlaceImportOperation,
  PlaceImportStatus,
} from '@/shared/api/generated/model'
import type { QueryClient } from '@tanstack/react-query'

/** Terminal statuses после которых realtime-каналы операции больше не нужны. */
export const PLACE_IMPORT_TERMINAL_STATUSES = [
  'completed',
  'failed',
  'expired',
  'cancelled',
] as const satisfies readonly PlaceImportStatus[]

const terminalStatusSet: ReadonlySet<PlaceImportStatus> = new Set(
  PLACE_IMPORT_TERMINAL_STATUSES,
)

/** Проверяет, завершилась ли операция импорта без дальнейших server transitions. */
export function isTerminalPlaceImportStatus(status: PlaceImportStatus) {
  return terminalStatusSet.has(status)
}

/** Записывает authoritative snapshot операции в React Query cache. */
export function syncPlaceImportOperationCache(
  queryClient: QueryClient,
  operation: PlaceImportOperation,
) {
  queryClient.setQueryData(
    getGetPlaceImportOperationQueryKey({ operationId: operation.id }),
    (current: PlaceImportOperation | undefined) =>
      current && current.version > operation.version ? current : operation,
  )
}

/** Инвалидирует места и категории после terminal успешного импорта. */
export function invalidatePlaceImportResultQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: getListAdminPlacesQueryKey() }),
    queryClient.invalidateQueries({
      queryKey: getListAdminPlaceCategoriesQueryKey(),
    }),
  ])
}
