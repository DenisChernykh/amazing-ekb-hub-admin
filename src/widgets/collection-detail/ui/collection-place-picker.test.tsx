import { useAddCollectionPlaceMutation } from '@/entities/collection'
import { usePlacesListQuery } from '@/entities/place/model/place-hooks'
import type {
  AdminCollectionDetailResponseDto,
  AdminPlaceSummaryResponseDto,
} from '@/shared/api'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionPlacePickerWithAction } from './collection-place-picker'

vi.mock('@/entities/collection', () => ({
  useAddCollectionPlaceMutation: vi.fn(),
}))
vi.mock('@/entities/place/model/place-hooks', () => ({
  usePlacesListQuery: vi.fn(),
}))

const candidate = (id: string, title: string, status: 'active' | 'hidden') =>
  ({
    category: {
      coverImageUrl: null,
      id: 'category-1',
      slug: 'category',
      title: 'Category',
    },
    collections: [],
    coverImageUrl: null,
    id,
    mapsUrl: null,
    slug: id,
    status,
    summary: '',
    tags: [],
    title,
  }) as AdminPlaceSummaryResponseDto

const collection = {
  activePlaceCount: 1,
  coverImageUrl: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  description: null,
  hiddenPlaceCount: 0,
  id: 'collection-1',
  places: [],
  position: 0,
  slug: 'spa',
  status: 'draft',
  title: 'SPA',
  updatedAt: '2026-08-01T00:00:00.000Z',
} satisfies AdminCollectionDetailResponseDto

describe('CollectionPlacePickerWithAction', () => {
  let queryCalls: Array<Record<string, unknown>>
  let mutationOptions: {
    onError?: (error: Error) => void
    onSuccess?: () => void
  }

  beforeEach(() => {
    queryCalls = []
    mutationOptions = {}
    vi.mocked(usePlacesListQuery).mockImplementation((params) => {
      queryCalls.push(params as Record<string, unknown>)
      return {
        data: {
          items: [candidate('place-1', 'Candidate', 'active')],
          page: params.page,
          pageSize: params.pageSize,
          total: 101,
        },
        isFetching: false,
      } as never
    })
    vi.mocked(useAddCollectionPlaceMutation).mockImplementation((options) => {
      mutationOptions = options as typeof mutationOptions
      return {
        isPending: false,
        mutate: vi.fn(() => mutationOptions.onSuccess?.()),
      } as never
    })
  })

  const renderPicker = () =>
    render(
      <AntdApp>
        <CollectionPlacePickerWithAction collection={collection} />
      </AntdApp>,
    )

  it('loads page 2 for more than 50 places and resets to page 1 on search', () => {
    renderPicker()

    fireEvent.click(screen.getByTitle('2'))
    expect(queryCalls.at(-1)).toMatchObject({ page: 2, pageSize: 50 })

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '  sauna  ' },
    })
    expect(queryCalls.at(-1)).toMatchObject({
      page: 1,
      pageSize: 50,
      search: 'sauna',
    })
  })

  it('does not send an empty place id and keeps a selected place after an error', async () => {
    const mutate = vi.fn(() => mutationOptions.onError?.(new Error('failed')))
    vi.mocked(useAddCollectionPlaceMutation).mockImplementation((options) => {
      mutationOptions = options as typeof mutationOptions
      return { isPending: false, mutate } as never
    })
    renderPicker()

    const addButton = screen.getByRole('button', { name: 'Добавить' })
    expect(addButton).toBeDisabled()
    fireEvent.click(addButton)
    expect(mutate).not.toHaveBeenCalled()

    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText('Candidate (активно)'))
    expect(addButton).toBeEnabled()
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Добавить' })).toBeEnabled()
    })
  })

  it('clears selected place only after the add mutation succeeds', async () => {
    renderPicker()

    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText('Candidate (активно)'))
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Добавить' })).toBeDisabled()
    })
  })
})
