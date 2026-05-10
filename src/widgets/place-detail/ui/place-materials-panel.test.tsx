import { usePlaceMaterialsListQuery } from '@/entities/material/model/material-hooks'
import { CreateMaterialDrawer } from '@/features/material/create/ui/create-material-drawer'
import { EditMaterialDrawer } from '@/features/material/edit/ui/edit-material-drawer'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { MaterialListResponse } from '@/shared/api/generated/operation'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceMaterialsPanel } from './place-materials-panel'

vi.mock('@/entities/material/model/material-hooks', () => ({
  usePlaceMaterialsListQuery: vi.fn(),
}))

vi.mock('@/features/material/create/ui/create-material-drawer', () => ({
  CreateMaterialDrawer: vi.fn(
    ({ open, placeId }: { open: boolean; placeId: string }) =>
      open ? <div role="dialog">create material for {placeId}</div> : null,
  ),
}))

vi.mock('@/features/material/edit/ui/edit-material-drawer', () => ({
  EditMaterialDrawer: vi.fn(
    ({
      material,
      open,
      placeId,
    }: {
      material: { title: string }
      open: boolean
      placeId: string
    }) =>
      open ? (
        <div role="dialog">
          edit material {material.title} for {placeId}
        </div>
      ) : null,
  ),
}))

const mockedUsePlaceMaterialsListQuery = vi.mocked(usePlaceMaterialsListQuery)
const mockedCreateMaterialDrawer = vi.mocked(CreateMaterialDrawer)
const mockedEditMaterialDrawer = vi.mocked(EditMaterialDrawer)

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
  beforeEach(() => {
    mockedUsePlaceMaterialsListQuery.mockReset()
    mockedCreateMaterialDrawer.mockClear()
    mockedEditMaterialDrawer.mockClear()
  })

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

  it('opens create material drawer from panel action', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(<PlaceMaterialsPanel placeId="place-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Добавить материал' }))

    expect(screen.getByText('create material for place-1')).toBeInTheDocument()
  })

  it('opens edit material drawer from row action', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(<PlaceMaterialsPanel placeId="place-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }))

    expect(
      screen.getByText('edit material Обзор комплекса for place-1'),
    ).toBeInTheDocument()
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
