import { useMaterialLibraryQuery } from '@/entities/material/model/material-library-hooks'
import { MaterialAdminStatusActions } from '@/features/material/admin-status/ui/material-admin-status-actions'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { AdminMaterialLibraryItem } from '@/shared/api/generated/model'
import type { AdminMaterialLibraryListResponse } from '@/shared/api/generated/operation'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MaterialLibraryInbox } from './material-library-inbox'

vi.mock('@/entities/material/model/material-library-hooks', () => ({
  useMaterialLibraryQuery: vi.fn(),
}))

vi.mock(
  '@/features/material/admin-status/ui/material-admin-status-actions',
  () => ({
    MaterialAdminStatusActions: vi.fn(
      ({ material }: { material: AdminMaterialLibraryItem }) => (
        <div>actions for {material.id}</div>
      ),
    ),
  }),
)

const mockedUseMaterialLibraryQuery = vi.mocked(useMaterialLibraryQuery)
const mockedMaterialAdminStatusActions = vi.mocked(MaterialAdminStatusActions)

const telegramMaterial: AdminMaterialLibraryItem = {
  adminStatus: 'pending',
  durationSec: null,
  excerpt: 'Пост из Telegram-канала Amazing EKB',
  externalId: '321',
  id: 'material-telegram-1',
  linked: true,
  mediaKind: 'photo',
  mediaPreviewUrl: 'https://cdn.example.com/telegram-321.jpg',
  platform: 'telegram',
  placeLink: null,
  publishedAt: '2026-03-20T10:30:00.000Z',
  source: {
    displayName: 'Amazing EKB Telegram',
    id: 'source-telegram-1',
    platform: 'telegram',
    url: 'https://t.me/amazing_ekb',
  },
  text: 'Полный текст Telegram-поста',
  title: null,
  type: 'post',
  url: 'https://t.me/amazing_ekb/321',
}

const dzenMaterial: AdminMaterialLibraryItem = {
  ...telegramMaterial,
  adminStatus: 'approved',
  excerpt: null,
  externalId: null,
  id: 'material-dzen-1',
  linked: false,
  mediaKind: null,
  platform: 'dzen',
  publishedAt: '2026-03-22T09:00:00.000Z',
  source: null,
  text: null,
  title: 'Видеообзор термального комплекса',
  type: 'video',
  url: 'https://dzen.ru/video/watch/abcdef',
}

const unsafeMaterial: AdminMaterialLibraryItem = {
  ...telegramMaterial,
  adminStatus: 'pending',
  excerpt: 'Материал с unsafe ссылками',
  externalId: 'unsafe-external-id',
  id: 'material-unsafe-1',
  linked: false,
  mediaKind: 'photo',
  mediaPreviewUrl: 'data:text/html,<script>alert(1)</script>',
  platform: 'telegram',
  publishedAt: '2026-03-23T09:00:00.000Z',
  source: {
    displayName: 'Unsafe source',
    id: 'source-unsafe-1',
    platform: 'telegram',
    url: 'javascript://example.com/%0Aalert(1)',
  },
  text: null,
  title: null,
  type: 'post',
  url: 'javascript://example.com/%0Aalert(1)',
}

const materialLibraryResponse = {
  items: [telegramMaterial, dzenMaterial],
  page: 2,
  pageSize: 20,
  total: 43,
} satisfies AdminMaterialLibraryListResponse

const renderInbox = (route = '/materials') => {
  render(
    <MemoryRouter initialEntries={[route]}>
      <MaterialLibraryInbox />
    </MemoryRouter>,
  )
}

describe('MaterialLibraryInbox', () => {
  beforeEach(() => {
    mockedUseMaterialLibraryQuery.mockReset()
    mockedMaterialAdminStatusActions.mockClear()
  })

  it('uses URL filters and pagination for material library query', () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: materialLibraryResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)

    renderInbox(
      '/materials?platform=telegram&adminStatus=pending&linked=false&page=2&pageSize=50',
    )

    expect(mockedUseMaterialLibraryQuery).toHaveBeenCalledWith({
      adminStatus: 'pending',
      linked: false,
      page: 2,
      pageSize: 50,
      platform: 'telegram',
    })
  })

  it('renders material library rows with safe source, material, and media links', () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: materialLibraryResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)

    renderInbox()

    expect(document.title).toBe('Материалы | Amazing EKB Admin')
    expect(screen.getByText('Материалы')).toBeInTheDocument()
    expect(screen.getByText('Всего: 43')).toBeInTheDocument()
    expect(
      screen.queryByRole('columnheader', { name: 'External ID' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('321')).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Amazing EKB Telegram' }),
    ).toHaveAttribute('href', 'https://t.me/amazing_ekb')
    expect(
      screen.queryByRole('link', { name: 'Ручной материал' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Telegram')).toBeInTheDocument()
    expect(screen.getByText('2026-03-20')).toBeInTheDocument()
    expect(
      screen.getByText('Пост из Telegram-канала Amazing EKB'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', {
        name: 'Пост из Telegram-канала Amazing EKB',
      }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Открыть пост' })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: 'https://t.me/amazing_ekb/321',
        }),
      ]),
    )
    expect(screen.getByText('Фото')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Открыть медиа' })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: 'https://cdn.example.com/telegram-321.jpg',
        }),
      ]),
    )
    expect(screen.getByText('Связан')).toBeInTheDocument()
    expect(screen.getByText('На проверке')).toBeInTheDocument()
    expect(
      screen.getByText('Видеообзор термального комплекса'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', {
        name: 'Видеообзор термального комплекса',
      }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Открыть пост' })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: 'https://dzen.ru/video/watch/abcdef',
        }),
      ]),
    )
    expect(screen.getByText('Ручной материал')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Не связан')).toBeInTheDocument()
    expect(screen.getByText('Одобрено')).toBeInTheDocument()
    expect(
      screen.getByText('actions for material-telegram-1'),
    ).toBeInTheDocument()
  })

  it('changes material library page through URL state', async () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: {
        ...materialLibraryResponse,
        page: 1,
        pageSize: 1,
        total: 2,
      },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)

    renderInbox('/materials?page=1&pageSize=1')

    fireEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(mockedUseMaterialLibraryQuery).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 1,
      })
    })
  })

  it('renders unsafe material, source, and media URLs as plain text', () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: { items: [unsafeMaterial] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)

    renderInbox()

    expect(screen.getByText('Unsafe source')).toBeInTheDocument()
    expect(screen.getByText('Материал с unsafe ссылками')).toBeInTheDocument()
    expect(screen.getByText('Фото')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Unsafe source' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Материал с unsafe ссылками' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Открыть пост' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Открыть медиа' }),
    ).not.toBeInTheDocument()
  })

  it('renders forbidden state for permission errors', () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'permission',
        message: 'Forbidden',
        status: 403,
      }),
      isError: true,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)

    renderInbox()

    expect(screen.getByText('Доступ запрещен')).toBeInTheDocument()
  })

  it('renders filtered empty state and resets page when reset', async () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: {
        items: [],
        page: 4,
        pageSize: 50,
        total: 0,
      },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)

    renderInbox('/materials?adminStatus=rejected&page=4&pageSize=50')

    expect(
      screen.getByText('По выбранным фильтрам материалов не найдено'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))

    await waitFor(() => {
      expect(mockedUseMaterialLibraryQuery).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 50,
      })
    })
  })
})
