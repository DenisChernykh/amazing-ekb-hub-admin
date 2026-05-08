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

vi.mock('@/features/place/status/ui/place-status-panel', () => ({
  PlaceStatusPanel: ({
    placeId,
    status,
  }: {
    placeId: string
    status: string
  }) => <div>Place status panel: {`${placeId}:${status}`}</div>,
}))

vi.mock('@/features/place/cover/ui/place-cover-upload-panel', async () => {
  const React = await vi.importActual<typeof import('react')>('react')

  return {
    PlaceCoverUploadPanel: ({
      coverImageUrl,
      placeId,
    }: {
      coverImageUrl: string | null
      placeId: string
    }) => {
      const [initialPlaceId] = React.useState(placeId)

      return (
        <div>
          Place cover upload panel:{' '}
          {`${placeId}:${coverImageUrl}:initial:${initialPlaceId}`}
        </div>
      )
    },
  }
})

vi.mock('./place-materials-panel', () => ({
  PlaceMaterialsPanel: ({
    placeId,
    placeStatus,
  }: {
    placeId: string
    placeStatus: string
  }) => <div>Place materials panel: {`${placeId}:${placeStatus}`}</div>,
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

const renderPlaceDetailScreen = (placeId = 'place-2') => {
  return render(
    <MemoryRouter>
      <PlaceDetailScreen placeId={placeId} />
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
    expect(
      screen.getByText('Place status panel: place-2:hidden'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Place cover upload panel: place-2:null:initial:place-2',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Place materials panel: place-2:hidden'),
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
    expect(screen.getByRole('link', { name: 'Редактировать' })).toHaveAttribute(
      'href',
      '/places/place-2/edit',
    )
  })

  it('remounts cover upload panel when place changes', () => {
    const nextPlace: PlaceDetail = {
      ...hiddenPlace,
      coverImageUrl: '/places/place-3/photo',
      id: 'place-3',
      title: 'Новый SPA',
    }
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: hiddenPlace,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)

    const { rerender } = renderPlaceDetailScreen('place-2')

    expect(
      screen.getByText(
        'Place cover upload panel: place-2:null:initial:place-2',
      ),
    ).toBeInTheDocument()

    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: nextPlace,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)

    rerender(
      <MemoryRouter>
        <PlaceDetailScreen placeId="place-3" />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(
        'Place cover upload panel: place-3:/places/place-3/photo:initial:place-3',
      ),
    ).toBeInTheDocument()
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
