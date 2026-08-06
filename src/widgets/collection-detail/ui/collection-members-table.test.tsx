import type { AdminCollectionDetailResponseDto } from '@/shared/api'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import styles from './collection-detail.module.css'
import { CollectionMembersTable } from './collection-members-table'

vi.mock(
  '@/features/collection/membership/ui/remove-collection-place-action',
  () => ({
    RemoveCollectionPlaceAction: () => <button>Удалить</button>,
  }),
)

const member = (id: string, title: string, position: number) => ({
  place: {
    category: {
      coverImageUrl: null,
      id: 'category-1',
      slug: 'category',
      title: 'Category',
    },
    coverImageUrl: null,
    id,
    slug: id,
    status: 'active' as const,
    summary: '',
    tags: [],
    title,
  },
  position,
})

const collection = {
  activePlaceCount: 2,
  coverImageUrl: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  description: null,
  hiddenPlaceCount: 0,
  id: 'collection-1',
  places: [member('place-1', 'One', 0), member('place-2', 'Two', 1)],
  position: 0,
  slug: 'spa',
  status: 'draft',
  title: 'SPA',
  updatedAt: '2026-08-01T00:00:00.000Z',
} satisfies AdminCollectionDetailResponseDto

describe('CollectionMembersTable', () => {
  it('applies the CSS module highlight only to the imported result row', () => {
    render(
      <MemoryRouter>
        <CollectionMembersTable
          addedPlaceId="place-1"
          collection={collection}
        />
      </MemoryRouter>,
    )

    const highlightedRow = screen.getByText('One').closest('tr')
    const otherRow = screen.getByText('Two').closest('tr')
    expect(highlightedRow).toHaveClass(styles.highlight)
    expect(otherRow).not.toHaveClass(styles.highlight)
  })
})
