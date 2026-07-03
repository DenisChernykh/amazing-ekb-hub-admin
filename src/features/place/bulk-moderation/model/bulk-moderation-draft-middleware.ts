import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
  clearBulkModerationDraftSelection,
  saveBulkModerationDraftSelection,
} from './bulk-moderation-draft-storage'
import {
  bulkModerationActions,
  selectBulkModerationSelectedPlaces,
  type BulkModerationRootState,
} from './bulk-moderation-slice'

const bulkModerationDraftListener =
  createListenerMiddleware<BulkModerationRootState>()

bulkModerationDraftListener.startListening({
  effect: (_, listenerApi) => {
    saveBulkModerationDraftSelection(
      selectBulkModerationSelectedPlaces(listenerApi.getState()),
    )
  },
  matcher: isAnyOf(
    bulkModerationActions.deselectPlace,
    bulkModerationActions.restoreDraftSelection,
    bulkModerationActions.selectPlace,
    bulkModerationActions.setVisiblePlacesSelection,
  ),
})

bulkModerationDraftListener.startListening({
  effect: () => {
    clearBulkModerationDraftSelection()
  },
  matcher: isAnyOf(
    bulkModerationActions.resetBulkModeration,
    bulkModerationActions.startBulkOperation,
  ),
})

/**
 * Redux middleware, синхронизирующий черновик выбора bulk moderation с `sessionStorage`.
 *
 * @remarks Сохраняет только selection-снимки и очищает черновик перед стартом локальной очереди.
 */
export const bulkModerationDraftMiddleware =
  bulkModerationDraftListener.middleware
