import { useCollectionsQuery } from '@/entities/collection'
import { render, screen } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionsScreen } from './collections-screen'

vi.mock('@/entities/collection', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/collection')>()),
  useCollectionsQuery: vi.fn(),
}))
vi.mock('@/features/collection/reorder/ui/collection-order-actions', () => ({
  CollectionOrderActions: StatefulOrderActions,
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

function StatefulOrderActions({
  collections,
}: {
  collections: Array<{ id: string; title: string }>
}) {
  const [initialCollections] = useState(collections)
  return (
    <div data-testid="reorder-state">
      {initialCollections.map(({ id, title }) => (
        <span key={id}>{title}</span>
      ))}
    </div>
  )
}

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
    expect(screen.getAllByText('SPA').length).toBeGreaterThan(0)
  })

  it('remounts reorder state after the server collection set changes', () => {
    const first = {
      activePlaceCount: 1,
      coverImageUrl: null,
      createdAt: '2026-08-01',
      description: null,
      hiddenPlaceCount: 0,
      id: 'collection-1',
      position: 0,
      slug: 'spa',
      status: 'draft' as const,
      title: 'SPA',
      updatedAt: '2026-08-01',
    }
    const second = { ...first, id: 'collection-2', title: 'Weekend' }
    let items = [first]
    vi.mocked(useCollectionsQuery).mockImplementation(
      () =>
        ({
          data: { items },
          isError: false,
          isFetching: false,
          isPending: false,
        }) as never,
    )
    const { rerender } = render(
      <AntdApp>
        <MemoryRouter>
          <CollectionsScreen />
        </MemoryRouter>
      </AntdApp>,
    )
    items = [second]
    rerender(
      <AntdApp>
        <MemoryRouter>
          <CollectionsScreen />
        </MemoryRouter>
      </AntdApp>,
    )

    expect(screen.getByTestId('reorder-state')).toHaveTextContent('Weekend')
    expect(screen.getByTestId('reorder-state')).not.toHaveTextContent('SPA')
  })
})
