import { usePlaceMaterialsListQuery } from '@/entities/material/model/material-hooks'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { MaterialListResponse } from '@/shared/api/generated/operation'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlaceMaterialsPanel } from './place-materials-panel'

vi.mock('@/entities/material/model/material-hooks', () => ({
  usePlaceMaterialsListQuery: vi.fn(),
}))

const mockedUsePlaceMaterialsListQuery = vi.mocked(usePlaceMaterialsListQuery)

const materialsResponse: MaterialListResponse = {
  items: [
    {
      durationSec: 125,
      id: 'material-1',
      placeId: 'place-1',
      platform: 'telegram',
      publishedAt: '2026-03-20T10:30:00.000Z',
      title: 'Обзор комплекса',
      type: 'post',
      url: 'https://t.me/amazing_ekb/321',
    },
  ],
}

describe('PlaceMaterialsPanel', () => {
  it('renders active place materials in a read-only table', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(<PlaceMaterialsPanel placeId="place-1" />)

    expect(mockedUsePlaceMaterialsListQuery).toHaveBeenCalledWith('place-1')
    expect(screen.getByText('Материалы')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Обзор комплекса' }),
    ).toHaveAttribute('href', 'https://t.me/amazing_ekb/321')
    expect(screen.getByText('Telegram')).toBeInTheDocument()
    expect(screen.getByText('Пост')).toBeInTheDocument()
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('loads hidden place materials through admin endpoint', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(<PlaceMaterialsPanel placeId="place-1" />)

    expect(mockedUsePlaceMaterialsListQuery).toHaveBeenCalledWith('place-1')
    expect(screen.getByRole('link', { name: 'Обзор комплекса' })).toBeVisible()
  })

  it('renders normalized API error message', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'server',
        message: 'Materials unavailable',
        status: 500,
      }),
      isError: true,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(<PlaceMaterialsPanel placeId="place-1" />)

    expect(screen.getByText('Materials unavailable')).toBeInTheDocument()
  })
})
