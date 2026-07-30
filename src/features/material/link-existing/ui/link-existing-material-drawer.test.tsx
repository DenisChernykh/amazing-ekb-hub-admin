import { useMaterialLibraryQuery } from '@/entities/material/model/material-library-hooks'
import { useLinkPlaceMaterialMutation } from '@/entities/material/model/material-mutations'
import type {
  AdminMaterialLibraryResponseDto,
  MaterialResponseDto,
} from '@/shared/api'
import { ApiClientError } from '@/shared/api/client/api-error'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LinkExistingMaterialDrawer } from './link-existing-material-drawer'

vi.mock('@/entities/material/model/material-library-hooks', () => ({
  useMaterialLibraryQuery: vi.fn(),
}))

vi.mock('@/entities/material/model/material-mutations', () => ({
  useLinkPlaceMaterialMutation: vi.fn(),
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

const mockedUseMaterialLibraryQuery = vi.mocked(useMaterialLibraryQuery)
const mockedUseLinkPlaceMaterialMutation = vi.mocked(
  useLinkPlaceMaterialMutation,
)

const libraryMaterial: AdminMaterialLibraryResponseDto = {
  adminStatus: 'approved',
  durationSec: null,
  excerpt: 'Пост из Telegram-канала Amazing EKB',
  externalId: '321',
  id: 'material-1',
  linked: false,
  mediaKind: 'photo',
  mediaPreviewUrl: 'https://cdn.example.com/telegram-321.jpg',
  platform: 'telegram',
  placeLink: null,
  publishedAt: '2026-03-20T10:30:00+05:00',
  source: {
    displayName: 'Amazing EKB Telegram',
    id: 'source-1',
    platform: 'telegram',
    url: 'https://t.me/amazing_ekb',
  },
  text: 'Полный текст Telegram-поста',
  title: null,
  type: 'post',
  url: 'https://t.me/amazing_ekb/321',
}

const linkedMaterial: MaterialResponseDto = {
  durationSec: null,
  id: 'material-1',
  placeId: 'place-1',
  platform: 'telegram',
  publishedAt: '2026-03-20T10:30:00+05:00',
  redirectUrl: null,
  title: 'Пост из Telegram-канала Amazing EKB',
  type: 'post',
  url: 'https://t.me/amazing_ekb/321',
}

const unsafeMaterial: AdminMaterialLibraryResponseDto = {
  ...libraryMaterial,
  excerpt: 'Материал с unsafe ссылками',
  id: 'unsafe-material',
  mediaPreviewUrl: 'data:text/html,<script>alert(1)</script>',
  source: {
    displayName: 'Unsafe source',
    id: 'source-unsafe',
    platform: 'telegram',
    url: 'javascript://example.com/%0Aalert(1)',
  },
  url: 'javascript://example.com/%0Aalert(1)',
}

const hiddenPlaceLinkMaterial: AdminMaterialLibraryResponseDto = {
  ...libraryMaterial,
  excerpt: 'Скрытая связь для текущего места',
  id: 'hidden-material',
  linked: true,
  placeLink: 'hidden',
  url: 'https://t.me/amazing_ekb/322',
}

const activePlaceLinkMaterial: AdminMaterialLibraryResponseDto = {
  ...libraryMaterial,
  excerpt: 'Активная связь для текущего места',
  id: 'active-material',
  linked: true,
  placeLink: 'active',
  url: 'https://t.me/amazing_ekb/323',
}

const renderDrawer = (props: { onClose?: () => void; open?: boolean } = {}) => {
  const onClose = props.onClose ?? vi.fn()

  render(
    <AntdApp>
      <LinkExistingMaterialDrawer
        onClose={onClose}
        open={props.open ?? true}
        placeId="place-1"
      />
    </AntdApp>,
  )

  return { onClose }
}

type LinkMutationCallbacks = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (material: MaterialResponseDto) => void
}

type LinkMutationVariables = {
  materialId: string
  placeId: string
}

describe('LinkExistingMaterialDrawer', () => {
  beforeEach(() => {
    messageError.mockReset()
    messageSuccess.mockReset()
    mockedUseMaterialLibraryQuery.mockReset()
    mockedUseLinkPlaceMaterialMutation.mockReset()
  })

  it('loads approved library materials for the current place and hides active place links', () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: {
        items: [
          libraryMaterial,
          hiddenPlaceLinkMaterial,
          activePlaceLinkMaterial,
        ],
      },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)
    mockedUseLinkPlaceMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useLinkPlaceMaterialMutation>)

    renderDrawer()

    expect(mockedUseMaterialLibraryQuery).toHaveBeenCalledWith(
      { adminStatus: 'approved', placeId: 'place-1' },
      { enabled: true },
    )
    expect(screen.getByText('Добавить из библиотеки')).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: 'Amazing EKB Telegram' })[0],
    ).toHaveAttribute('href', 'https://t.me/amazing_ekb')
    expect(screen.getAllByText('Telegram')[0]).toBeInTheDocument()
    expect(screen.getAllByText('2026-03-20')[0]).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: 'Пост из Telegram-канала Amazing EKB',
      }),
    ).toHaveAttribute('href', 'https://t.me/amazing_ekb/321')
    expect(screen.getAllByText('Фото')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Одобрено')[0]).toBeInTheDocument()
    expect(screen.getByText('Не связан')).toBeInTheDocument()
    expect(
      screen.getByText('Скрытая связь для текущего места'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Активная связь для текущего места'),
    ).not.toBeInTheDocument()
  })

  it('links selected material and closes after success', async () => {
    const onClose = vi.fn()
    const mutate = vi.fn(
      (
        _variables: LinkMutationVariables,
        callbacks?: LinkMutationCallbacks,
      ) => {
        callbacks?.onSuccess?.(linkedMaterial)
      },
    )
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: { items: [libraryMaterial] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)
    mockedUseLinkPlaceMaterialMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useLinkPlaceMaterialMutation>)

    renderDrawer({ onClose })

    fireEvent.click(screen.getByRole('button', { name: 'Связать' }))

    expect(mutate).toHaveBeenCalledWith(
      { materialId: 'material-1', placeId: 'place-1' },
      expect.any(Object),
    )
    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('Материал связан с местом')
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('renders normalized link error and leaves drawer open for retry', async () => {
    const onClose = vi.fn()
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: { items: [libraryMaterial] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)
    mockedUseLinkPlaceMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: (
        _variables: LinkMutationVariables,
        callbacks?: LinkMutationCallbacks,
      ) => {
        callbacks?.onError?.(
          new ApiClientError({
            kind: 'server',
            message: 'Link unavailable',
            status: 500,
          }),
        )
      },
    } as unknown as ReturnType<typeof useLinkPlaceMaterialMutation>)

    renderDrawer({ onClose })

    fireEvent.click(screen.getByRole('button', { name: 'Связать' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Link unavailable',
    )
    expect(messageError).toHaveBeenCalledWith('Link unavailable')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables link actions while mutation is pending', () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: { items: [libraryMaterial] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)
    mockedUseLinkPlaceMaterialMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useLinkPlaceMaterialMutation>)

    renderDrawer()

    expect(screen.getByRole('button', { name: 'Связать' })).toBeDisabled()
  })

  it('renders unsafe source, material, and media URLs as plain text', () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: { items: [unsafeMaterial] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)
    mockedUseLinkPlaceMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useLinkPlaceMaterialMutation>)

    renderDrawer()

    expect(screen.getByText('Unsafe source')).toBeInTheDocument()
    expect(screen.getByText('Материал с unsafe ссылками')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Unsafe source' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Материал с unsafe ссылками' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Открыть медиа' }),
    ).not.toBeInTheDocument()
  })

  it('renders loading, error, and empty states', () => {
    mockedUseLinkPlaceMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useLinkPlaceMaterialMutation>)
    mockedUseMaterialLibraryQuery.mockReturnValueOnce({
      data: undefined,
      error: null,
      isError: false,
      isFetching: false,
      isPending: true,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)
    const { rerender } = render(
      <AntdApp>
        <LinkExistingMaterialDrawer onClose={vi.fn()} open placeId="place-1" />
      </AntdApp>,
    )

    expect(
      screen.getByText('Загружаем библиотеку материалов'),
    ).toBeInTheDocument()

    mockedUseMaterialLibraryQuery.mockReturnValueOnce({
      data: undefined,
      error: new ApiClientError({
        kind: 'server',
        message: 'Library unavailable',
        status: 500,
      }),
      isError: true,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)
    rerender(
      <AntdApp>
        <LinkExistingMaterialDrawer onClose={vi.fn()} open placeId="place-1" />
      </AntdApp>,
    )

    expect(screen.getByText('Library unavailable')).toBeInTheDocument()

    mockedUseMaterialLibraryQuery.mockReturnValueOnce({
      data: { items: [] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)
    rerender(
      <AntdApp>
        <LinkExistingMaterialDrawer onClose={vi.fn()} open placeId="place-1" />
      </AntdApp>,
    )

    expect(
      screen.getByText('Подходящих материалов пока нет'),
    ).toBeInTheDocument()
  })
})
