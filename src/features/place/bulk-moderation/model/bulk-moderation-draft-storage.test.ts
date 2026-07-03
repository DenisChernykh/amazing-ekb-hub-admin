import type { PlaceSummary } from '@/shared/api/generated/model'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  BULK_MODERATION_DRAFT_SELECTION_TTL_MS,
  clearBulkModerationDraftSelection,
  getRestorableBulkModerationDraftPlaces,
  readBulkModerationDraftSelection,
  saveBulkModerationDraftSelection,
} from './bulk-moderation-draft-storage'

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

describe('bulk moderation draft storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-03T01:00:00.000Z'))
  })

  afterEach(() => {
    window.sessionStorage.clear()
    vi.useRealTimers()
  })

  it('saves a versioned sessionStorage payload with selected place snapshots only', () => {
    saveBulkModerationDraftSelection([activePlace])

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

  it('reads a valid draft within the ttl window', () => {
    window.sessionStorage.setItem(
      BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      JSON.stringify({
        places: [activePlace],
        savedAt: Date.now() - BULK_MODERATION_DRAFT_SELECTION_TTL_MS + 1,
        version: 1,
      }),
    )

    expect(readBulkModerationDraftSelection()).toEqual({
      places: [
        {
          id: 'place-1',
          status: 'active',
          title: 'Аквацентр',
        },
      ],
      savedAt: Date.now() - BULK_MODERATION_DRAFT_SELECTION_TTL_MS + 1,
      version: 1,
    })
  })

  it('removes expired, malformed, and unsupported draft payloads', () => {
    window.sessionStorage.setItem(
      BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      JSON.stringify({
        places: [activePlace],
        savedAt: Date.now() - BULK_MODERATION_DRAFT_SELECTION_TTL_MS,
        version: 1,
      }),
    )

    expect(readBulkModerationDraftSelection()).toBeNull()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()

    window.sessionStorage.setItem(
      BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      '{broken',
    )

    expect(readBulkModerationDraftSelection()).toBeNull()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()

    window.sessionStorage.setItem(
      BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      JSON.stringify({
        places: [activePlace],
        savedAt: Date.now(),
        version: 2,
      }),
    )

    expect(readBulkModerationDraftSelection()).toBeNull()
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
  })

  it('filters restorable places through the currently loaded places response', () => {
    const updatedHiddenPlace: PlaceSummary = {
      ...hiddenPlace,
      title: 'Обновленный SPA',
    }

    expect(
      getRestorableBulkModerationDraftPlaces(
        {
          places: [
            activePlace,
            hiddenPlace,
            {
              id: 'stale-place',
              status: 'hidden',
              title: 'Старый снимок',
            },
          ],
          savedAt: Date.now(),
          version: 1,
        },
        [updatedHiddenPlace, activePlace],
      ),
    ).toEqual([
      {
        id: 'place-1',
        status: 'active',
        title: 'Аквацентр',
      },
      {
        id: 'place-2',
        status: 'hidden',
        title: 'Обновленный SPA',
      },
    ])
  })

  it('clears the draft payload explicitly', () => {
    saveBulkModerationDraftSelection([activePlace])

    clearBulkModerationDraftSelection()

    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
  })
})
