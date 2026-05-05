import { usePlacesListQuery } from '@/entities/place/model/place-hooks'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { PlaceListResponse } from '@/shared/api/generated/model'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlacesList } from './places-list'

vi.mock('@/entities/place/model/place-hooks', () => ({
  usePlacesListQuery: vi.fn(),
}))

const mockedUsePlacesListQuery = vi.mocked(usePlacesListQuery)

const places: PlaceListResponse = {
  items: [
    {
      category: 'pools',
      coverImageUrl: null,
      id: 'place-1',
      popularityWeight: 10,
      status: 'active',
      summary: 'Теплый бассейн в центре Екатеринбурга',
      tags: ['pool', 'family'],
      title: 'Аквацентр',
    },
  ],
  page: 2,
  pageSize: 20,
  total: 21,
}

const renderPlacesList = (route = '/places') => {
  render(
    <MemoryRouter initialEntries={[route]}>
      <PlacesList />
    </MemoryRouter>,
  )
}

describe('PlacesList', () => {
  beforeEach(() => {
    mockedUsePlacesListQuery.mockReset()
  })

  it('uses URL pagination params for places query', () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: places,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList('/places?page=2&pageSize=20')

    expect(mockedUsePlacesListQuery).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
    })
  })

  it('renders places table rows with localized metadata', () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: places,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList()

    expect(screen.getByText('Аквацентр')).toBeInTheDocument()
    expect(screen.getByText('Бассейны')).toBeInTheDocument()
    expect(screen.getByText('Опубликовано')).toBeInTheDocument()
    expect(screen.getByText('Всего: 21')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Создать место' })).toHaveAttribute(
      'href',
      '/places/new',
    )
  })

  it('renders normalized API error message', () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'server',
        message: 'Places unavailable',
        status: 500,
      }),
      isError: true,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList()

    expect(screen.getByText('Places unavailable')).toBeInTheDocument()
  })
})
