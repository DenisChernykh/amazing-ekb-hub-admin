import type { AdminCollectionSummaryResponseDto } from '@/shared/api'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getCollectionsTableColumns } from './collections-table-columns'

const collection = (coverImageUrl: string | null) =>
  ({
    activePlaceCount: 0,
    coverImageUrl,
    createdAt: '2026-08-01T00:00:00.000Z',
    description: null,
    hiddenPlaceCount: 0,
    id: 'collection-1',
    position: 0,
    slug: 'spa',
    status: 'draft',
    title: 'SPA',
    updatedAt: '2026-08-01T00:00:00.000Z',
  }) as AdminCollectionSummaryResponseDto

describe('collections table cover column', () => {
  it.each([
    ['null cover has an explicit absent status', null, 'Нет'],
    [
      'cover URL has an explicit present status',
      'https://cdn/cover.jpg',
      'Есть',
    ],
  ])('%s', (_name, coverImageUrl, expected) => {
    const coverColumn = getCollectionsTableColumns({
      onEdit: vi.fn(),
    }).find((column) => column.key === 'cover')
    if (!coverColumn || !coverColumn.render)
      throw new Error('cover column missing')

    render(
      <>{coverColumn.render(coverImageUrl, collection(coverImageUrl), 0)}</>,
    )

    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})
