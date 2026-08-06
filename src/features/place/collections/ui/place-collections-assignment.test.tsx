import { useReplacePlaceCollectionsMutation } from '@/entities/place/model/place-mutations'
import type {
  AdminCollectionSummaryResponseDto,
  AdminPlaceSummaryResponseDto,
} from '@/shared/api'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlaceCollectionsAssignment } from './place-collections-assignment'

vi.mock('@/entities/place/model/place-mutations', () => ({
  useReplacePlaceCollectionsMutation: vi.fn(),
}))

const place = {
  id: 'place-1',
  title: 'SPA',
  collections: [{ id: 'collection-1', status: 'draft', title: 'Город' }],
} as AdminPlaceSummaryResponseDto
const collections = [
  { id: 'collection-1', title: 'Город', status: 'draft' },
  { id: 'collection-2', title: 'Выходные', status: 'active' },
] as AdminCollectionSummaryResponseDto[]

describe('PlaceCollectionsAssignment', () => {
  it('renders server selection and saves explicit full set', async () => {
    const mutate = vi.fn()
    vi.mocked(useReplacePlaceCollectionsMutation).mockReturnValue({
      isPending: false,
      mutate,
    } as never)
    render(
      <PlaceCollectionsAssignment collections={collections} place={place} />,
    )
    expect(
      screen.getByRole('combobox', { name: 'Подборки для SPA' }),
    ).toBeInTheDocument()
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'Подборки для SPA' }),
    )
    expect(await screen.findByText('Выходные (активная)')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Выходные (активная)'))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { collectionIds: ['collection-1', 'collection-2'] },
        }),
      ),
    )
  })
})
