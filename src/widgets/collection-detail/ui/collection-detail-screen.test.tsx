import { useCollectionDetailQuery } from '@/entities/collection'
import type { AdminCollectionDetailResponseDto } from '@/shared/api'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionDetailScreen } from './collection-detail-screen'

vi.mock('@/entities/collection', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/collection')>()),
  useCollectionDetailQuery: vi.fn(),
}))
vi.mock('./collection-detail-header', () => ({
  CollectionDetailHeader: () => <div>Header</div>,
}))
vi.mock('@/features/collection/cover/ui/collection-cover-panel', () => ({
  CollectionCoverPanel: () => <div>Cover</div>,
}))
vi.mock('./collection-place-picker', () => ({
  CollectionPlacePickerWithAction: () => <div>Picker</div>,
}))
vi.mock('./collection-members-table', () => ({
  CollectionMembersOrder: () => <div>Order</div>,
  CollectionMembersTable: () => <div>Members</div>,
}))

const collection = {
  activePlaceCount: 0,
  coverImageUrl: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  description: null,
  hiddenPlaceCount: 1,
  id: 'collection-1',
  places: [],
  position: 0,
  slug: 'spa',
  status: 'active',
  title: 'SPA',
  updatedAt: '2026-08-01T00:00:00.000Z',
} satisfies AdminCollectionDetailResponseDto

describe('CollectionDetailScreen', () => {
  beforeEach(() => vi.mocked(useCollectionDetailQuery).mockReset())

  it('warns when active collection has no active public members', () => {
    vi.mocked(useCollectionDetailQuery).mockReturnValue({
      data: collection,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    render(
      <MemoryRouter>
        <CollectionDetailScreen collectionId="collection-1" />
      </MemoryRouter>,
    )
    expect(screen.getByText(/нет активных мест/)).toBeInTheDocument()
  })
})
