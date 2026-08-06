import { useReorderCollectionsMutation } from '@/entities/collection'
import type { AdminCollectionSummaryResponseDto } from '@/shared/api'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionOrderActions } from './collection-order-actions'

vi.mock('@/entities/collection', () => ({
  useReorderCollectionsMutation: vi.fn(),
}))

type MutationCallbacks = {
  onError?: (error: Error) => void
  onSuccess?: () => void
}

const collections = [
  { id: 'collection-a', position: 0, title: 'A' },
  { id: 'collection-b', position: 1, title: 'B' },
  { id: 'collection-c', position: 2, title: 'C' },
] as AdminCollectionSummaryResponseDto[]

const makeMutation = () => {
  const mutate = vi.fn()
  let callbacks: MutationCallbacks = {}
  let submittedCallbacks: MutationCallbacks = {}
  vi.mocked(useReorderCollectionsMutation).mockImplementation((options) => {
    callbacks = options as MutationCallbacks
    mutate.mockImplementationOnce(() => {
      submittedCallbacks = callbacks
    })
    return { isPending: false, mutate } as never
  })
  return {
    callbacks: () => callbacks,
    submittedCallbacks: () => submittedCallbacks,
    mutate,
  }
}

describe('CollectionOrderActions', () => {
  beforeEach(() => vi.mocked(useReorderCollectionsMutation).mockReset())

  it('renders a new canonical global set when the parent remount key changes', () => {
    const mutation = makeMutation()
    const canonicalKey = (items: AdminCollectionSummaryResponseDto[]) =>
      items.map(({ id, position }) => `${id}:${position}`).join('|')
    const { rerender } = render(
      <CollectionOrderActions
        collections={collections}
        key={canonicalKey(collections)}
        onOrderConfirmed={vi.fn()}
      />,
    )

    expect(screen.getByText('A')).toBeInTheDocument()
    const nextCollections = [
      { id: 'collection-new', position: 0, title: 'New' },
    ] as AdminCollectionSummaryResponseDto[]
    rerender(
      <CollectionOrderActions
        collections={nextCollections}
        key={canonicalKey(nextCollections)}
        onOrderConfirmed={vi.fn()}
      />,
    )

    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.queryByText('A')).not.toBeInTheDocument()
    expect(mutation.mutate).not.toHaveBeenCalled()
  })

  it('renders fresh collection metadata without resetting the draft order', () => {
    makeMutation()
    const { rerender } = render(
      <CollectionOrderActions
        collections={collections}
        onOrderConfirmed={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Переместить B выше' }))
    rerender(
      <CollectionOrderActions
        collections={collections.map((collection) =>
          collection.id === 'collection-b'
            ? { ...collection, title: 'Renamed B' }
            : collection,
        )}
        onOrderConfirmed={vi.fn()}
      />,
    )

    const labels = screen
      .getAllByText(/^(A|C|Renamed B)$/)
      .map((element) => element.textContent)
    expect(labels).toEqual(['Renamed B', 'A', 'C'])
  })

  it('confirms the submitted order and rolls a later failure back to it', () => {
    const { submittedCallbacks, mutate } = makeMutation()
    render(
      <CollectionOrderActions
        collections={collections}
        onOrderConfirmed={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Переместить B выше' }))
    expect(mutate).toHaveBeenNthCalledWith(1, {
      collectionIds: ['collection-b', 'collection-a', 'collection-c'],
    })
    act(() => submittedCallbacks().onSuccess?.())

    fireEvent.click(screen.getByRole('button', { name: 'Переместить B ниже' }))
    expect(mutate).toHaveBeenNthCalledWith(2, {
      collectionIds: ['collection-a', 'collection-b', 'collection-c'],
    })
    act(() => submittedCallbacks().onError?.(new Error('network')))

    const labels = screen
      .getAllByText(/^[ABC]$/)
      .map((element) => element.textContent)
    expect(labels).toEqual(['B', 'A', 'C'])
  })

  it('uses the same exact full-set payload and locks actions while pending', () => {
    const mutate = vi.fn()
    vi.mocked(useReorderCollectionsMutation).mockReturnValue({
      isPending: true,
      mutate,
    } as never)
    render(
      <CollectionOrderActions
        collections={collections}
        onOrderConfirmed={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Переместить B выше' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Перетащить B' })).toBeDisabled()
    expect(mutate).not.toHaveBeenCalled()
  })
})
