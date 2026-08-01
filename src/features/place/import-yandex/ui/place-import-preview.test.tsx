import type { PlaceImportOperationResponseDto } from '@/shared/api'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { PlaceImportPreview } from './place-import-preview'

const preview: PlaceImportOperationResponseDto = {
  attempt: 1,
  captchaExpiresAt: null,
  category: {
    id: null,
    resolution: 'will_create',
    status: 'draft',
    title: 'SPA',
  },
  createdAt: '2026-07-22T10:00:00.000Z',
  error: null,
  id: 'operation-1',
  mapsUrl: 'https://yandex.ru/maps/org/spa/1',
  organizationId: '1',
  outcome: null,
  possibleDuplicate: { placeId: 'place-2', title: 'Похожий SPA' },
  previewExpiresAt: '2026-07-22T11:00:00.000Z',
  resultPlaceId: null,
  sourceUrl: 'https://yandex.ru/maps/org/spa/1',
  status: 'preview_ready',
  title: 'Новый SPA',
  updatedAt: '2026-07-22T10:01:00.000Z',
  version: 3,
}

describe('PlaceImportPreview', () => {
  it('shows immutable preview, draft category and semantic duplicate link', () => {
    render(
      <MemoryRouter>
        <PlaceImportPreview operation={preview} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Новый SPA')).toBeInTheDocument()
    expect(screen.getByText('Черновик')).toBeInTheDocument()
    expect(screen.getByText('Будет создан черновик')).toBeInTheDocument()
    expect(screen.getByText(/Похожее место: Похожий SPA/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Открыть место' })).toHaveAttribute(
      'href',
      '/places/place-2',
    )
  })
})
