import { createAppStore } from '@/app/store'
import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import {
  bulkModerationActions,
  selectBulkModerationSelectedCount,
} from '@/features/place/bulk-moderation/model/bulk-moderation-slice'
import type { PlaceSummary } from '@/shared/api/generated/model'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BulkModerationDraftRestorePrompt } from './bulk-moderation-draft-restore-prompt'

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

const renderPrompt = () => {
  const store = createAppStore()

  render(
    <Provider store={store}>
      <BulkModerationDraftRestorePrompt loadedPlaces={[activePlace]} />
    </Provider>,
  )

  return store
}

describe('BulkModerationDraftRestorePrompt', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-03T01:00:00.000Z'))
  })

  afterEach(() => {
    window.sessionStorage.clear()
    vi.useRealTimers()
  })

  it('does not restore a draft that was cleared after the prompt mounted', () => {
    saveBulkModerationDraftSelection([activePlace])
    const store = renderPrompt()

    expect(
      screen.getByText('Есть сохраненный черновик выбора'),
    ).toBeInTheDocument()

    act(() => {
      store.dispatch(bulkModerationActions.selectPlace(activePlace))
      store.dispatch(bulkModerationActions.resetBulkModeration())
    })
    fireEvent.click(screen.getByRole('button', { name: 'Восстановить' }))

    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
    expect(selectBulkModerationSelectedCount(store.getState())).toBe(0)
  })

  it('does not restore a draft that expires after the prompt mounted', () => {
    saveBulkModerationDraftSelection([activePlace])
    const store = renderPrompt()

    vi.advanceTimersByTime(30 * 60 * 1000)
    fireEvent.click(screen.getByRole('button', { name: 'Восстановить' }))

    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
    expect(selectBulkModerationSelectedCount(store.getState())).toBe(0)
  })
})
