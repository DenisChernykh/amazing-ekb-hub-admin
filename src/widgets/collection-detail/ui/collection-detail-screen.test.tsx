import { useCollectionDetailQuery } from '@/entities/collection'
import type { AdminCollectionDetailResponseDto } from '@/shared/api'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionDetailScreen } from './collection-detail-screen'

vi.mock('@/entities/collection', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/collection')>()),
  useCollectionDetailQuery: vi.fn(),
}))
vi.mock('./collection-detail-header', () => ({
  CollectionDetailHeader: ({ onEdit }: { onEdit: () => void }) => (
    <button onClick={onEdit}>Редактировать подборку</button>
  ),
}))
vi.mock('@/features/collection/edit/ui/edit-collection-drawer', () => ({
  EditCollectionDrawer: ({
    collection: selected,
    onClose,
  }: {
    collection: AdminCollectionDetailResponseDto | null
    onClose: () => void
  }) =>
    selected ? (
      <div role="dialog">
        <span>{selected.title}</span>
        <button onClick={onClose}>Сохранить подборку</button>
      </div>
    ) : null,
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

  it('opens the existing edit drawer with the authoritative detail data', async () => {
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

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Редактировать подборку' }),
    )
    await waitFor(() =>
      expect(screen.getByRole('dialog')).toHaveTextContent('SPA'),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить подборку' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })
})
