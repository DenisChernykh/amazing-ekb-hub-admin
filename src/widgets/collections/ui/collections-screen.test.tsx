import { useCollectionsQuery } from '@/entities/collection'
import { render, screen } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionsScreen } from './collections-screen'

vi.mock('@/entities/collection', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/collection')>()),
  useCollectionsQuery: vi.fn(),
}))
vi.mock('@/features/collection/reorder/ui/collection-order-actions', () => ({
  CollectionOrderActions: () => <div>Reorder</div>,
}))
vi.mock('@/features/collection/create/ui/create-collection-drawer', () => ({
  CreateCollectionDrawer: () => null,
}))
vi.mock('@/features/collection/edit/ui/edit-collection-drawer', () => ({
  EditCollectionDrawer: () => null,
}))
vi.mock('@/features/collection/status/ui/collection-status-actions', () => ({
  CollectionStatusActions: () => <div>Status</div>,
}))
vi.mock('@/features/collection/delete/ui/delete-collection-button', () => ({
  DeleteCollectionButton: () => <div>Delete</div>,
}))

describe('CollectionsScreen', () => {
  beforeEach(() => vi.mocked(useCollectionsQuery).mockReset())

  it('renders server-ordered collection list and total', () => {
    vi.mocked(useCollectionsQuery).mockReturnValue({
      data: {
        items: [
          {
            activePlaceCount: 1,
            coverImageUrl: null,
            createdAt: '2026-08-01',
            description: null,
            hiddenPlaceCount: 0,
            id: 'collection-1',
            position: 0,
            slug: 'spa',
            status: 'draft',
            title: 'SPA',
            updatedAt: '2026-08-01',
          },
        ],
      },
      isError: false,
      isFetching: false,
      isPending: false,
    } as never)
    render(
      <AntdApp>
        <MemoryRouter>
          <CollectionsScreen />
        </MemoryRouter>
      </AntdApp>,
    )
    expect(
      screen.getByRole('heading', { name: 'Подборки' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Всего: 1')).toBeInTheDocument()
    expect(screen.getByText('SPA')).toBeInTheDocument()
  })
})
