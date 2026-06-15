import { useMaterialLibraryQuery } from '@/entities/material/model/material-library-hooks'
import { MaterialAdminStatusActions } from '@/features/material/admin-status/ui/material-admin-status-actions'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { AdminMaterialLibraryItem } from '@/shared/api/generated/model'
import type { AdminMaterialLibraryListResponse } from '@/shared/api/generated/operation'
import { render, screen } from '@testing-library/react'
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
  mediaPreviewUrl: null,
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

const materialLibraryResponse: AdminMaterialLibraryListResponse = {
  items: [telegramMaterial, dzenMaterial],
}

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

  it('uses URL filters for material library query', () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: materialLibraryResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)

    renderInbox('/materials?platform=telegram&adminStatus=pending&linked=false')

    expect(mockedUseMaterialLibraryQuery).toHaveBeenCalledWith({
      adminStatus: 'pending',
      linked: false,
      platform: 'telegram',
    })
  })

  it('renders material library rows with source, review status, and actions', () => {
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
    expect(screen.getByText('Всего: 2')).toBeInTheDocument()
    expect(screen.getByText('Amazing EKB Telegram')).toBeInTheDocument()
    expect(screen.getByText('Telegram')).toBeInTheDocument()
    expect(screen.getByText('321')).toBeInTheDocument()
    expect(screen.getByText('2026-03-20')).toBeInTheDocument()
    expect(
      screen.getByText('Пост из Telegram-канала Amazing EKB'),
    ).toBeInTheDocument()
    expect(screen.getByText('Фото')).toBeInTheDocument()
    expect(screen.getByText('Связан')).toBeInTheDocument()
    expect(screen.getByText('На проверке')).toBeInTheDocument()
    expect(
      screen.getByText('Видеообзор термального комплекса'),
    ).toBeInTheDocument()
    expect(screen.getByText('Не связан')).toBeInTheDocument()
    expect(screen.getByText('Одобрено')).toBeInTheDocument()
    expect(
      screen.getByText('actions for material-telegram-1'),
    ).toBeInTheDocument()
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

  it('renders empty state for filtered material library', () => {
    mockedUseMaterialLibraryQuery.mockReturnValue({
      data: { items: [] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMaterialLibraryQuery>)

    renderInbox('/materials?adminStatus=rejected')

    expect(
      screen.getByText('По выбранным фильтрам материалов не найдено'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Сбросить фильтры' }),
    ).toBeInTheDocument()
  })
})
