import { useAdminPlaceDetailQuery } from '@/entities/place/model/place-hooks'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { PlaceDetail } from '@/shared/api/generated/model'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceDetailScreen } from './place-detail-screen'

vi.mock('@/entities/place/model/place-hooks', () => ({
  useAdminPlaceDetailQuery: vi.fn(),
}))

const mockedUseAdminPlaceDetailQuery = vi.mocked(useAdminPlaceDetailQuery)

const hiddenPlace: PlaceDetail = {
  category: 'spa',
  counters: {
    dzen: 1,
    instagram: 0,
    telegram: 2,
  },
  coverImageUrl: null,
  id: 'place-2',
  pinnedMaterial: null,
  popularityWeight: 5,
  status: 'hidden',
  summary: 'Скрытый SPA для проверки admin detail',
  tags: ['spa', 'hidden'],
  title: 'Скрытый SPA',
}

const renderPlaceDetailScreen = () => {
  render(
    <MemoryRouter>
      <PlaceDetailScreen placeId="place-2" />
    </MemoryRouter>,
  )
}

describe('PlaceDetailScreen', () => {
  beforeEach(() => {
    mockedUseAdminPlaceDetailQuery.mockReset()
  })

  it('loads hidden place through admin detail query and renders read-only data', () => {
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: hiddenPlace,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)

    renderPlaceDetailScreen()

    expect(mockedUseAdminPlaceDetailQuery).toHaveBeenCalledWith('place-2')
    expect(
      screen.getByRole('heading', { name: 'Скрытый SPA' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Скрыто')).toBeInTheDocument()
    expect(screen.getByText('SPA')).toBeInTheDocument()
    expect(
      screen.getByText('Скрытый SPA для проверки admin detail'),
    ).toBeInTheDocument()
    expect(screen.getByText('telegram: 2')).toBeInTheDocument()
    expect(screen.getByText('Материал не закреплен')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'К списку мест' })).toHaveAttribute(
      'href',
      '/places',
    )
  })

  it('renders normalized API error message', () => {
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'server',
        message: 'Place unavailable',
        status: 500,
      }),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)

    renderPlaceDetailScreen()

    expect(screen.getByText('Place unavailable')).toBeInTheDocument()
  })
})
