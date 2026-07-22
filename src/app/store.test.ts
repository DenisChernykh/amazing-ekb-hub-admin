import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { bulkModerationActions } from '@/features/place/bulk-moderation/model/bulk-moderation-slice'
import type { PlaceSummary } from '@/shared/api/generated/model'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from './store'

const poolsCategory = {
  coverImageUrl: null,
  id: 'category_pools',
  slug: 'pools',
  title: 'Бассейны',
}

const spaCategory = {
  coverImageUrl: null,
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
}

const activePlace: PlaceSummary = {
  category: poolsCategory,
  coverImageUrl: null,
  id: 'place-1',
  slug: 'aquacenter',
  status: 'active',
  summary: 'Теплый бассейн',
  tags: ['pool'],
  title: 'Аквацентр',
}

const hiddenPlace: PlaceSummary = {
  category: spaCategory,
  coverImageUrl: null,
  id: 'place-2',
  slug: 'hidden-spa',
  status: 'hidden',
  summary: 'Скрытый SPA',
  tags: ['spa'],
  title: 'Скрытый SPA',
}

describe('createAppStore', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-03T01:00:00.000Z'))
  })

  afterEach(() => {
    window.sessionStorage.clear()
    vi.useRealTimers()
  })

  it('persists only bulk moderation draft selection after selection changes', () => {
    const store = createAppStore()

    store.dispatch(bulkModerationActions.selectPlace(activePlace))

    expect(
      JSON.parse(
        window.sessionStorage.getItem(
          BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
        ) ?? '{}',
      ),
    ).toEqual({
      places: [
        {
          id: 'place-1',
          status: 'active',
          title: 'Аквацентр',
        },
      ],
      savedAt: Date.now(),
      version: 1,
    })
  })

  it('clears bulk moderation draft selection after manual reset', () => {
    const store = createAppStore()

    saveBulkModerationDraftSelection([activePlace])

    store.dispatch(bulkModerationActions.resetBulkModeration())

    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
  })

  it('clears draft selection when an operation starts and never persists queue progress or undo state', () => {
    const store = createAppStore()

    store.dispatch(bulkModerationActions.selectPlace(activePlace))
    store.dispatch(bulkModerationActions.selectPlace(hiddenPlace))
    store.dispatch(
      bulkModerationActions.startBulkOperation({ targetStatus: 'hidden' }),
    )
    store.dispatch(bulkModerationActions.markItemPending(activePlace.id))
    store.dispatch(bulkModerationActions.markItemSucceeded(activePlace.id))
    store.dispatch(bulkModerationActions.finishOperation())
    store.dispatch(bulkModerationActions.startUndoOperation())

    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
  })
})
