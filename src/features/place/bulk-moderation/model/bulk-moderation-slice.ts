import type {
  AdminPlaceSummaryResponseDto,
  AdminPlaceSummaryResponseDtoStatus,
} from '@/shared/api'
import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'

/**
 * Минимальный снимок места, который bulk moderation хранит локально.
 */
export type BulkModerationSelectedPlace = Pick<
  AdminPlaceSummaryResponseDto,
  'id' | 'status' | 'title'
>

/**
 * Статус одного элемента в локальной очереди bulk moderation.
 */
export type BulkModerationQueueItemStatus =
  'queued' | 'pending' | 'succeeded' | 'failed'

/**
 * Режим текущей локальной операции bulk moderation.
 */
export type BulkModerationOperationKind = 'bulk' | 'undo'

/**
 * Статус локальной операции bulk moderation.
 */
export type BulkModerationOperationStatus = 'idle' | 'running' | 'finished'

/**
 * Элемент очереди bulk moderation с исходным и целевым статусом.
 */
export type BulkModerationQueueItem = Pick<
  BulkModerationSelectedPlace,
  'id' | 'title'
> & {
  errorMessage: string | null
  operationStatus: BulkModerationQueueItemStatus
  previousStatus: AdminPlaceSummaryResponseDtoStatus
  targetStatus: AdminPlaceSummaryResponseDtoStatus
}

/**
 * Redux-state локального workflow массовой модерации.
 *
 * @remarks Не хранит серверные коллекции и не persistится между reload.
 */
export type BulkModerationState = {
  operationKind: BulkModerationOperationKind | null
  operationStatus: BulkModerationOperationStatus
  operationTargetStatus: AdminPlaceSummaryResponseDtoStatus | null
  queueById: Record<string, BulkModerationQueueItem>
  queueOrder: string[]
  selectedById: Record<string, BulkModerationSelectedPlace>
  selectedOrder: string[]
}

/**
 * Минимальная форма root-state для selectors bulk moderation.
 */
export type BulkModerationRootState = {
  bulkModeration: BulkModerationState
}

const initialState: BulkModerationState = {
  operationKind: null,
  operationStatus: 'idle',
  operationTargetStatus: null,
  queueById: {},
  queueOrder: [],
  selectedById: {},
  selectedOrder: [],
}

const toSelectedPlace = (
  place: BulkModerationSelectedPlace,
): BulkModerationSelectedPlace => ({
  id: place.id,
  status: place.status,
  title: place.title,
})

const addSelectedPlace = (
  state: BulkModerationState,
  place: BulkModerationSelectedPlace,
) => {
  const selectedPlace = toSelectedPlace(place)

  if (!state.selectedById[selectedPlace.id]) {
    state.selectedOrder.push(selectedPlace.id)
  }

  state.selectedById[selectedPlace.id] = selectedPlace
}

const removeSelectedPlace = (state: BulkModerationState, placeId: string) => {
  if (!state.selectedById[placeId]) {
    return
  }

  delete state.selectedById[placeId]
  state.selectedOrder = state.selectedOrder.filter((id) => id !== placeId)
}

const createQueueItem = (
  place: BulkModerationSelectedPlace,
  targetStatus: AdminPlaceSummaryResponseDtoStatus,
): BulkModerationQueueItem => ({
  errorMessage: null,
  id: place.id,
  operationStatus: 'queued',
  previousStatus: place.status,
  targetStatus,
  title: place.title,
})

const setQueueItems = (
  state: BulkModerationState,
  items: BulkModerationQueueItem[],
  operationKind: BulkModerationOperationKind,
  operationTargetStatus: AdminPlaceSummaryResponseDtoStatus | null,
) => {
  state.operationKind = operationKind
  state.operationStatus = items.length > 0 ? 'running' : 'idle'
  state.operationTargetStatus = operationTargetStatus
  state.queueById = Object.fromEntries(items.map((item) => [item.id, item]))
  state.queueOrder = items.map((item) => item.id)
}

const bulkModerationSlice = createSlice({
  initialState,
  name: 'bulkModeration',
  reducers: {
    deselectPlace(state, action: PayloadAction<string>) {
      removeSelectedPlace(state, action.payload)
    },
    finishOperation(state) {
      if (state.queueOrder.length > 0) {
        state.operationStatus = 'finished'
      }
    },
    markItemFailed(
      state,
      action: PayloadAction<{ errorMessage: string; placeId: string }>,
    ) {
      const item = state.queueById[action.payload.placeId]

      if (item) {
        item.errorMessage = action.payload.errorMessage
        item.operationStatus = 'failed'
      }
    },
    markItemPending(state, action: PayloadAction<string>) {
      const item = state.queueById[action.payload]

      if (item) {
        item.errorMessage = null
        item.operationStatus = 'pending'
      }
    },
    markItemSucceeded(state, action: PayloadAction<string>) {
      const item = state.queueById[action.payload]

      if (item) {
        item.errorMessage = null
        item.operationStatus = 'succeeded'
      }
    },
    resetBulkModeration() {
      return initialState
    },
    restoreDraftSelection(
      state,
      action: PayloadAction<BulkModerationSelectedPlace[]>,
    ) {
      state.selectedById = {}
      state.selectedOrder = []

      for (const place of action.payload) {
        addSelectedPlace(state, place)
      }
    },
    retryFailedItems(state) {
      for (const item of Object.values(state.queueById)) {
        if (item.operationStatus === 'failed') {
          item.errorMessage = null
          item.operationStatus = 'queued'
        }
      }

      state.operationStatus = 'running'
    },
    selectPlace(state, action: PayloadAction<BulkModerationSelectedPlace>) {
      addSelectedPlace(state, action.payload)
    },
    setVisiblePlacesSelection(
      state,
      action: PayloadAction<{
        places: BulkModerationSelectedPlace[]
        selectedIds: string[]
      }>,
    ) {
      const selectedIds = new Set(action.payload.selectedIds)

      for (const place of action.payload.places) {
        if (selectedIds.has(place.id)) {
          addSelectedPlace(state, place)
        } else {
          removeSelectedPlace(state, place.id)
        }
      }
    },
    startBulkOperation(
      state,
      action: PayloadAction<{
        targetStatus: AdminPlaceSummaryResponseDtoStatus
      }>,
    ) {
      const items = state.selectedOrder.map((id) =>
        createQueueItem(state.selectedById[id], action.payload.targetStatus),
      )

      state.selectedById = {}
      state.selectedOrder = []
      setQueueItems(state, items, 'bulk', action.payload.targetStatus)
    },
    startUndoOperation(state) {
      const items: BulkModerationQueueItem[] = state.queueOrder
        .map((id) => state.queueById[id])
        .filter((item) => item.operationStatus === 'succeeded')
        .map((item) => ({
          ...item,
          errorMessage: null,
          operationStatus: 'queued',
          previousStatus: item.targetStatus,
          targetStatus: item.previousStatus,
        }))

      setQueueItems(state, items, 'undo', null)
    },
  },
})

/**
 * Reducer локального workflow массовой модерации мест.
 */
export const bulkModerationReducer = bulkModerationSlice.reducer

/**
 * Actions локального workflow массовой модерации мест.
 */
export const bulkModerationActions = bulkModerationSlice.actions

/**
 * Возвращает state bulk moderation из root-state.
 */
export const selectBulkModerationState = (state: BulkModerationRootState) =>
  state.bulkModeration

/**
 * Возвращает выбранные места в порядке выбора.
 */
export const selectBulkModerationSelectedPlaces = createSelector(
  [selectBulkModerationState],
  (bulkState) =>
    bulkState.selectedOrder.map((id) => bulkState.selectedById[id]),
)

/**
 * Возвращает ids выбранных мест в порядке выбора.
 */
export const selectBulkModerationSelectedIds = createSelector(
  [selectBulkModerationSelectedPlaces],
  (places) => places.map((place) => place.id),
)

/**
 * Возвращает количество выбранных мест.
 */
export const selectBulkModerationSelectedCount = (
  state: BulkModerationRootState,
) => selectBulkModerationState(state).selectedOrder.length

/**
 * Возвращает элементы текущей очереди в стабильном порядке.
 */
export const selectBulkModerationQueueItems = createSelector(
  [selectBulkModerationState],
  (bulkState) => bulkState.queueOrder.map((id) => bulkState.queueById[id]),
)

/**
 * Возвращает элементы очереди, ожидающие выполнения.
 */
export const selectBulkModerationQueuedItems = createSelector(
  [selectBulkModerationQueueItems],
  (items) => items.filter((item) => item.operationStatus === 'queued'),
)

/**
 * Возвращает элементы очереди, завершившиеся ошибкой.
 */
export const selectBulkModerationFailedItems = createSelector(
  [selectBulkModerationQueueItems],
  (items) => items.filter((item) => item.operationStatus === 'failed'),
)

/**
 * Возвращает успешно выполненные элементы очереди.
 */
export const selectBulkModerationSucceededItems = createSelector(
  [selectBulkModerationQueueItems],
  (items) => items.filter((item) => item.operationStatus === 'succeeded'),
)

/**
 * Возвращает `true`, пока локальная очередь выполняется.
 */
export const selectBulkModerationIsRunning = (state: BulkModerationRootState) =>
  selectBulkModerationState(state).operationStatus === 'running'
