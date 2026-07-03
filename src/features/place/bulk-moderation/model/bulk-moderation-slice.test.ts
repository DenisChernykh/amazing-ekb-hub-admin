import type { PlaceSummary } from '@/shared/api/generated/model'
import { describe, expect, it } from 'vitest'
import {
  bulkModerationActions,
  bulkModerationReducer,
  selectBulkModerationQueueItems,
  selectBulkModerationSelectedCount,
  selectBulkModerationSelectedIds,
  selectBulkModerationState,
  selectBulkModerationSucceededItems,
  type BulkModerationRootState,
} from './bulk-moderation-slice'

const activePlace: PlaceSummary = {
  category: 'pools',
  coverImageUrl: null,
  id: 'place-1',
  popularityWeight: 10,
  status: 'active',
  summary: 'Теплый бассейн',
  tags: ['pool'],
  title: 'Аквацентр',
}

const hiddenPlace: PlaceSummary = {
  category: 'spa',
  coverImageUrl: null,
  id: 'place-2',
  popularityWeight: 5,
  status: 'hidden',
  summary: 'Скрытый SPA',
  tags: ['spa'],
  title: 'Скрытый SPA',
}

const createRootState = (
  state: ReturnType<typeof bulkModerationReducer>,
): BulkModerationRootState => ({
  bulkModeration: state,
})

describe('bulkModerationReducer', () => {
  it('selects and unselects individual places', () => {
    let state = bulkModerationReducer(
      undefined,
      bulkModerationActions.selectPlace(activePlace),
    )

    expect(selectBulkModerationSelectedIds(createRootState(state))).toEqual([
      'place-1',
    ])
    expect(selectBulkModerationSelectedCount(createRootState(state))).toBe(1)

    state = bulkModerationReducer(
      state,
      bulkModerationActions.deselectPlace(activePlace.id),
    )

    expect(selectBulkModerationSelectedIds(createRootState(state))).toEqual([])
    expect(selectBulkModerationSelectedCount(createRootState(state))).toBe(0)
  })

  it('updates only the visible page selection and preserves other pages', () => {
    let state = bulkModerationReducer(
      undefined,
      bulkModerationActions.selectPlace(activePlace),
    )

    state = bulkModerationReducer(
      state,
      bulkModerationActions.setVisiblePlacesSelection({
        places: [hiddenPlace],
        selectedIds: [hiddenPlace.id],
      }),
    )

    expect(selectBulkModerationSelectedIds(createRootState(state))).toEqual([
      'place-1',
      'place-2',
    ])

    state = bulkModerationReducer(
      state,
      bulkModerationActions.setVisiblePlacesSelection({
        places: [hiddenPlace],
        selectedIds: [],
      }),
    )

    expect(selectBulkModerationSelectedIds(createRootState(state))).toEqual([
      'place-1',
    ])
  })

  it('starts a queue from selected places with previous and target statuses', () => {
    let state = bulkModerationReducer(
      undefined,
      bulkModerationActions.selectPlace(activePlace),
    )
    state = bulkModerationReducer(
      state,
      bulkModerationActions.selectPlace(hiddenPlace),
    )

    state = bulkModerationReducer(
      state,
      bulkModerationActions.startBulkOperation({ targetStatus: 'hidden' }),
    )

    expect(selectBulkModerationSelectedCount(createRootState(state))).toBe(0)
    expect(selectBulkModerationQueueItems(createRootState(state))).toEqual([
      expect.objectContaining({
        id: 'place-1',
        operationStatus: 'queued',
        previousStatus: 'active',
        targetStatus: 'hidden',
      }),
      expect.objectContaining({
        id: 'place-2',
        operationStatus: 'queued',
        previousStatus: 'hidden',
        targetStatus: 'hidden',
      }),
    ])
  })

  it('tracks pending, success, failure, and retry states per item', () => {
    let state = bulkModerationReducer(
      undefined,
      bulkModerationActions.selectPlace(activePlace),
    )
    state = bulkModerationReducer(
      state,
      bulkModerationActions.startBulkOperation({ targetStatus: 'hidden' }),
    )
    state = bulkModerationReducer(
      state,
      bulkModerationActions.markItemPending(activePlace.id),
    )
    state = bulkModerationReducer(
      state,
      bulkModerationActions.markItemFailed({
        errorMessage: 'Network error',
        placeId: activePlace.id,
      }),
    )

    expect(selectBulkModerationQueueItems(createRootState(state))).toEqual([
      expect.objectContaining({
        errorMessage: 'Network error',
        id: 'place-1',
        operationStatus: 'failed',
      }),
    ])

    state = bulkModerationReducer(
      state,
      bulkModerationActions.retryFailedItems(),
    )

    expect(selectBulkModerationQueueItems(createRootState(state))).toEqual([
      expect.objectContaining({
        errorMessage: null,
        id: 'place-1',
        operationStatus: 'queued',
      }),
    ])

    state = bulkModerationReducer(
      state,
      bulkModerationActions.markItemPending(activePlace.id),
    )
    state = bulkModerationReducer(
      state,
      bulkModerationActions.markItemSucceeded(activePlace.id),
    )

    expect(selectBulkModerationSucceededItems(createRootState(state))).toEqual([
      expect.objectContaining({
        id: 'place-1',
        operationStatus: 'succeeded',
      }),
    ])
  })

  it('creates an undo queue from succeeded items with reversed statuses', () => {
    let state = bulkModerationReducer(
      undefined,
      bulkModerationActions.selectPlace(activePlace),
    )
    state = bulkModerationReducer(
      state,
      bulkModerationActions.startBulkOperation({ targetStatus: 'hidden' }),
    )
    state = bulkModerationReducer(
      state,
      bulkModerationActions.markItemSucceeded(activePlace.id),
    )

    state = bulkModerationReducer(
      state,
      bulkModerationActions.startUndoOperation(),
    )

    expect(selectBulkModerationQueueItems(createRootState(state))).toEqual([
      expect.objectContaining({
        id: 'place-1',
        operationStatus: 'queued',
        previousStatus: 'hidden',
        targetStatus: 'active',
      }),
    ])
  })

  it('resets selection and operation state', () => {
    let state = bulkModerationReducer(
      undefined,
      bulkModerationActions.selectPlace(activePlace),
    )
    state = bulkModerationReducer(
      state,
      bulkModerationActions.startBulkOperation({ targetStatus: 'hidden' }),
    )

    state = bulkModerationReducer(
      state,
      bulkModerationActions.resetBulkModeration(),
    )

    expect(selectBulkModerationSelectedCount(createRootState(state))).toBe(0)
    expect(selectBulkModerationQueueItems(createRootState(state))).toEqual([])
  })

  it('restores draft selection without recreating queue or operation state', () => {
    const state = bulkModerationReducer(
      undefined,
      bulkModerationActions.restoreDraftSelection([activePlace, hiddenPlace]),
    )

    expect(selectBulkModerationSelectedIds(createRootState(state))).toEqual([
      'place-1',
      'place-2',
    ])
    expect(selectBulkModerationQueueItems(createRootState(state))).toEqual([])
    expect(selectBulkModerationState(createRootState(state))).toMatchObject({
      operationKind: null,
      operationStatus: 'idle',
      operationTargetStatus: null,
    })
  })
})
