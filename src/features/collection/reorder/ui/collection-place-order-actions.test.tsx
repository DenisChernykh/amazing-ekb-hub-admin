import { useReorderCollectionPlacesMutation } from '@/entities/collection'
import type {
  AdminCollectionPlaceResponseDto,
  PlaceSummaryResponseDto,
} from '@/shared/api'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionPlaceOrderActions } from './collection-place-order-actions'

vi.mock('@/entities/collection', () => ({
  useReorderCollectionPlacesMutation: vi.fn(),
}))

type MutationCallbacks = {
  onError?: (error: Error) => void
  onSuccess?: () => void
}

const place = (id: string, title: string): PlaceSummaryResponseDto => ({
  category: {
    coverImageUrl: null,
    id: 'category-1',
    slug: 'category',
    title: 'Category',
  },
  coverImageUrl: null,
  id,
  slug: id,
  status: 'active',
  summary: '',
  tags: [],
  title,
})

const places = [
  { place: place('place-a', 'A'), position: 0 },
  { place: place('place-b', 'B'), position: 1 },
  { place: place('place-c', 'C'), position: 2 },
] satisfies AdminCollectionPlaceResponseDto[]

describe('CollectionPlaceOrderActions', () => {
  beforeEach(() => vi.mocked(useReorderCollectionPlacesMutation).mockReset())

  it('confirms submitted member order and rolls the next failure back', () => {
    const mutate = vi.fn()
    let callbacks: MutationCallbacks = {}
    let submittedCallbacks: MutationCallbacks = {}
    vi.mocked(useReorderCollectionPlacesMutation).mockImplementation(
      (options) => {
        callbacks = options as MutationCallbacks
        mutate.mockImplementationOnce(() => {
          submittedCallbacks = callbacks
        })
        return { isPending: false, mutate } as never
      },
    )
    render(
      <CollectionPlaceOrderActions
        collectionId="collection-1"
        places={places}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Переместить B выше' }))
    expect(mutate).toHaveBeenNthCalledWith(1, {
      collectionId: 'collection-1',
      placeIds: ['place-b', 'place-a', 'place-c'],
    })
    act(() => submittedCallbacks.onSuccess?.())

    fireEvent.click(screen.getByRole('button', { name: 'Переместить B ниже' }))
    expect(mutate).toHaveBeenNthCalledWith(2, {
      collectionId: 'collection-1',
      placeIds: ['place-a', 'place-b', 'place-c'],
    })
    act(() => submittedCallbacks.onError?.(new Error('network')))

    expect(
      screen.getAllByText(/^[ABC]$/).map((element) => element.textContent),
    ).toEqual(['B', 'A', 'C'])
  })

  it('remounts to the exact canonical member set after add or remove', () => {
    const mutate = vi.fn()
    vi.mocked(useReorderCollectionPlacesMutation).mockReturnValue({
      isPending: false,
      mutate,
    } as never)
    const key = (items: AdminCollectionPlaceResponseDto[]) =>
      items.map(({ place, position }) => `${place.id}:${position}`).join('|')
    const { rerender } = render(
      <CollectionPlaceOrderActions
        collectionId="collection-1"
        key={key(places)}
        places={places}
      />,
    )
    const nextPlaces = [
      { place: place('place-new', 'New'), position: 0 },
    ] satisfies AdminCollectionPlaceResponseDto[]

    rerender(
      <CollectionPlaceOrderActions
        collectionId="collection-1"
        key={key(nextPlaces)}
        places={nextPlaces}
      />,
    )

    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.queryByText('A')).not.toBeInTheDocument()
  })
})
