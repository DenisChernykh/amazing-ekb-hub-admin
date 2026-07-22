import {
  usePlaceImportEvents,
  usePlaceImportOperationQuery,
} from '@/entities/place-import/model/place-import-hooks'
import type { PlaceImportOperation } from '@/shared/api/generated/model'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { PlaceImportYandexScreen } from './place-import-yandex-screen'

vi.mock('@/entities/place-import/model/place-import-hooks', () => ({
  usePlaceImportEvents: vi.fn(() => ({
    isPollingFallback: false,
    pollingErrorMessage: null,
  })),
  usePlaceImportOperationQuery: vi.fn(),
}))

vi.mock('@/features/place/import-yandex/ui/place-import-actions', () => ({
  PlaceImportActions: () => <div>Actions</div>,
}))

const completedOperation = (
  outcome: PlaceImportOperation['outcome'],
): PlaceImportOperation => ({
  attempt: 1,
  captchaExpiresAt: null,
  category: null,
  createdAt: '2026-07-22T10:00:00.000Z',
  error: null,
  id: 'operation-1',
  mapsUrl: 'https://yandex.ru/maps/org/spa/1',
  organizationId: '1',
  outcome,
  possibleDuplicate: null,
  previewExpiresAt: null,
  resultPlaceId: 'place-result',
  sourceUrl: 'https://yandex.ru/maps/org/spa/1',
  status: 'completed',
  title: 'SPA',
  updatedAt: '2026-07-22T10:02:00.000Z',
  version: 4,
})

const renderCompleted = (outcome: PlaceImportOperation['outcome']) => {
  vi.mocked(usePlaceImportOperationQuery).mockReturnValue({
    data: completedOperation(outcome),
    isError: false,
    isPending: false,
  } as ReturnType<typeof usePlaceImportOperationQuery>)
  vi.mocked(usePlaceImportEvents).mockReturnValue({
    isPollingFallback: false,
    pollingErrorMessage: null,
  })

  render(
    <MemoryRouter initialEntries={['/places/import/yandex/operation-1']}>
      <Routes>
        <Route
          element={<PlaceImportYandexScreen operationId="operation-1" />}
          path="/places/import/yandex/:operationId"
        />
        <Route element={<div>Result place</div>} path="/places/:placeId" />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PlaceImportYandexScreen', () => {
  it('navigates a newly created hidden place to admin detail', () => {
    renderCompleted('created')
    expect(screen.getByText('Result place')).toBeInTheDocument()
  })

  it('navigates a strict external-identity duplicate to the existing place', () => {
    renderCompleted('already_exists')
    expect(screen.getByText('Result place')).toBeInTheDocument()
  })
})
