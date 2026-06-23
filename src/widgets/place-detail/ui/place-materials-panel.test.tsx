import { usePlaceMaterialsListQuery } from '@/entities/material/model/material-hooks'
import { useHidePlaceMaterialLinkMutation } from '@/entities/material/model/material-mutations'
import { CreateMaterialDrawer } from '@/features/material/create/ui/create-material-drawer'
import { EditMaterialDrawer } from '@/features/material/edit/ui/edit-material-drawer'
import { LinkExistingMaterialDrawer } from '@/features/material/link-existing/ui/link-existing-material-drawer'
import { PinnedMaterialPanel } from '@/features/place/pinned-material/ui/pinned-material-panel'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { Material } from '@/shared/api/generated/model'
import type { MaterialListResponse } from '@/shared/api/generated/operation'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceMaterialsPanel } from './place-materials-panel'

vi.mock('@/entities/material/model/material-hooks', () => ({
  usePlaceMaterialsListQuery: vi.fn(),
}))

vi.mock('@/entities/material/model/material-mutations', () => ({
  useHidePlaceMaterialLinkMutation: vi.fn(),
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

vi.mock(
  '@/features/material/link-existing/ui/link-existing-material-drawer',
  () => ({
    LinkExistingMaterialDrawer: vi.fn(
      ({ open, placeId }: { open: boolean; placeId: string }) =>
        open ? (
          <div role="dialog">link existing material for {placeId}</div>
        ) : null,
    ),
  }),
)

vi.mock('@/features/place/pinned-material/ui/pinned-material-panel', () => ({
  PinnedMaterialPanel: vi.fn(
    ({
      materials,
      pinnedMaterial,
      placeId,
    }: {
      materials: Material[]
      pinnedMaterial: Material | null
      placeId: string
    }) => (
      <div>
        pinned selector {placeId}:{pinnedMaterial?.title ?? 'none'}:
        {materials.length}
      </div>
    ),
  ),
}))

const messageError = vi.fn()
const messageSuccess = vi.fn()

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  const App = ({ children }: { children: ReactNode }) => <div>{children}</div>
  App.useApp = () => ({
    message: {
      error: messageError,
      success: messageSuccess,
    },
  })

  return {
    ...actual,
    App,
  }
})

const mockedUsePlaceMaterialsListQuery = vi.mocked(usePlaceMaterialsListQuery)
const mockedUseHidePlaceMaterialLinkMutation = vi.mocked(
  useHidePlaceMaterialLinkMutation,
)
const mockedCreateMaterialDrawer = vi.mocked(CreateMaterialDrawer)
const mockedEditMaterialDrawer = vi.mocked(EditMaterialDrawer)
const mockedLinkExistingMaterialDrawer = vi.mocked(LinkExistingMaterialDrawer)
const mockedPinnedMaterialPanel = vi.mocked(PinnedMaterialPanel)

const materialsResponse = {
  items: [
    {
      durationSec: 125,
      id: 'material-1',
      placeId: 'place-1',
      platform: 'telegram',
      publishedAt: '2026-03-20T10:30:00.000Z',
      title: 'Обзор комплекса',
      type: 'post',
      redirectUrl: '/v1/materials/material-1/go',
    },
  ],
} as unknown as MaterialListResponse

const pinnedMaterial = materialsResponse.items[0] ?? null

describe('PlaceMaterialsPanel', () => {
  beforeEach(() => {
    messageError.mockReset()
    messageSuccess.mockReset()
    mockedUsePlaceMaterialsListQuery.mockReset()
    mockedUseHidePlaceMaterialLinkMutation.mockReset()
    mockedUseHidePlaceMaterialLinkMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useHidePlaceMaterialLinkMutation>)
    mockedCreateMaterialDrawer.mockClear()
    mockedEditMaterialDrawer.mockClear()
    mockedLinkExistingMaterialDrawer.mockClear()
    mockedPinnedMaterialPanel.mockClear()
  })

  it('renders active place materials in a read-only table', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(
      <PlaceMaterialsPanel pinnedMaterial={pinnedMaterial} placeId="place-1" />,
    )

    expect(mockedUsePlaceMaterialsListQuery).toHaveBeenCalledWith('place-1')
    expect(
      screen.getByText('pinned selector place-1:Обзор комплекса:1'),
    ).toBeInTheDocument()
    expect(screen.getByText('Материалы')).toBeInTheDocument()
    expect(screen.getByText('Обзор комплекса')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Обзор комплекса' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Telegram')).toBeInTheDocument()
    expect(screen.getByText('Пост')).toBeInTheDocument()
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('renders Dzen material title as text when redirectUrl is absent', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: {
        items: [
          {
            ...materialsResponse.items[0],
            platform: 'dzen',
            redirectUrl: undefined,
            title: 'Дзен обзор',
            url: 'https://dzen.ru/video/watch/material-1',
          },
        ],
      },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(
      <PlaceMaterialsPanel pinnedMaterial={pinnedMaterial} placeId="place-1" />,
    )

    expect(screen.getByText('Дзен обзор')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Дзен обзор' }),
    ).not.toBeInTheDocument()
  })

  it('renders material title as text when redirectUrl is null', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: {
        items: [
          {
            ...materialsResponse.items[0],
            redirectUrl: null,
          },
        ],
      },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(
      <PlaceMaterialsPanel pinnedMaterial={pinnedMaterial} placeId="place-1" />,
    )

    expect(screen.getByText('Обзор комплекса')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Обзор комплекса' }),
    ).not.toBeInTheDocument()
  })

  it('opens create material drawer from panel action', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(
      <PlaceMaterialsPanel pinnedMaterial={pinnedMaterial} placeId="place-1" />,
    )

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

    render(
      <PlaceMaterialsPanel pinnedMaterial={pinnedMaterial} placeId="place-1" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }))

    expect(
      screen.getByText('edit material Обзор комплекса for place-1'),
    ).toBeInTheDocument()
  })

  it('opens link existing material drawer from panel action', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(
      <PlaceMaterialsPanel pinnedMaterial={pinnedMaterial} placeId="place-1" />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Добавить из библиотеки' }),
    )

    expect(
      screen.getByText('link existing material for place-1'),
    ).toBeInTheDocument()
  })

  it('hides place-material link through entity mutation', async () => {
    const mutate = vi.fn(
      (
        _variables: { materialId: string; placeId: string },
        callbacks?: { onSuccess?: () => void },
      ) => {
        callbacks?.onSuccess?.()
      },
    )
    mockedUseHidePlaceMaterialLinkMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useHidePlaceMaterialLinkMutation>)
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(
      <PlaceMaterialsPanel pinnedMaterial={pinnedMaterial} placeId="place-1" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Скрыть связь' }))

    expect(mutate).toHaveBeenCalledWith(
      { materialId: 'material-1', placeId: 'place-1' },
      expect.any(Object),
    )
    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('Связь скрыта')
    })
  })

  it('disables hide link action while mutation is pending', () => {
    mockedUseHidePlaceMaterialLinkMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useHidePlaceMaterialLinkMutation>)
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(
      <PlaceMaterialsPanel pinnedMaterial={pinnedMaterial} placeId="place-1" />,
    )

    expect(screen.getByRole('button', { name: 'Скрыть связь' })).toBeDisabled()
  })

  it('renders normalized hide link error and keeps action available for retry', async () => {
    mockedUseHidePlaceMaterialLinkMutation.mockReturnValue({
      isPending: false,
      mutate: (
        _variables: { materialId: string; placeId: string },
        callbacks?: { onError?: (error: ApiClientError) => void },
      ) => {
        callbacks?.onError?.(
          new ApiClientError({
            kind: 'server',
            message: 'Hide unavailable',
            status: 500,
          }),
        )
      },
    } as unknown as ReturnType<typeof useHidePlaceMaterialLinkMutation>)
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(
      <PlaceMaterialsPanel pinnedMaterial={pinnedMaterial} placeId="place-1" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Скрыть связь' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Hide unavailable',
    )
    expect(messageError).toHaveBeenCalledWith('Hide unavailable')
    expect(
      screen.getByRole('button', { name: 'Скрыть связь' }),
    ).not.toBeDisabled()
  })

  it('loads hidden place materials through admin endpoint', () => {
    mockedUsePlaceMaterialsListQuery.mockReturnValue({
      data: materialsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceMaterialsListQuery>)

    render(<PlaceMaterialsPanel pinnedMaterial={null} placeId="place-1" />)

    expect(mockedUsePlaceMaterialsListQuery).toHaveBeenCalledWith('place-1')
    expect(screen.getByText('Обзор комплекса')).toBeVisible()
    expect(
      screen.queryByRole('link', { name: 'Обзор комплекса' }),
    ).not.toBeInTheDocument()
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

    render(
      <PlaceMaterialsPanel pinnedMaterial={pinnedMaterial} placeId="place-1" />,
    )

    expect(screen.getByText('Materials unavailable')).toBeInTheDocument()
    expect(
      screen.getByText('pinned selector place-1:Обзор комплекса:0'),
    ).toBeInTheDocument()
  })
})
