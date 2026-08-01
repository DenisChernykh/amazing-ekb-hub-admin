import { useContentSourcesQuery } from '@/entities/content-source/model/content-source-hooks'
import { useImportRunEvents } from '@/entities/import-run/model/import-run-events'
import { useImportRunsQuery } from '@/entities/import-run/model/import-run-hooks'
import { CreateContentSourceDrawer } from '@/features/content-source/create/ui/create-content-source-drawer'
import { EditContentSourceDrawer } from '@/features/content-source/edit/ui/edit-content-source-drawer'
import { ImportTelegramSourceButton } from '@/features/content-source/import/ui/import-telegram-source-button'
import { ContentSourceStatusActions } from '@/features/content-source/status/ui/content-source-status-actions'
import type {
  ContentSourceListResponseDto,
  ContentSourceResponseDto,
  ImportRunListResponseDto,
  ImportRunResponseDto,
} from '@/shared/api'
import { createApiProblemError } from '@/test/api-problem'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ContentSourcesScreen } from './content-sources-screen'

vi.mock('@/entities/content-source/model/content-source-hooks', () => ({
  useContentSourcesQuery: vi.fn(),
}))

vi.mock('@/entities/import-run/model/import-run-hooks', () => ({
  useImportRunsQuery: vi.fn(),
}))

vi.mock('@/entities/import-run/model/import-run-events', () => ({
  useImportRunEvents: vi.fn(),
}))

vi.mock(
  '@/features/content-source/status/ui/content-source-status-actions',
  () => ({
    ContentSourceStatusActions: vi.fn(
      ({ contentSource }: { contentSource: ContentSourceResponseDto }) => (
        <div>status actions for {contentSource.id}</div>
      ),
    ),
  }),
)

vi.mock(
  '@/features/content-source/import/ui/import-telegram-source-button',
  () => ({
    ImportTelegramSourceButton: vi.fn(
      ({
        activeImportRun,
        contentSource,
      }: {
        activeImportRun?: ImportRunResponseDto | null
        contentSource: ContentSourceResponseDto
      }) => (
        <div>
          import action for {contentSource.id} active{' '}
          {activeImportRun?.id ?? 'none'}
        </div>
      ),
    ),
  }),
)

vi.mock(
  '@/features/content-source/create/ui/create-content-source-drawer',
  () => ({
    CreateContentSourceDrawer: vi.fn(({ open }: { open: boolean }) =>
      open ? <div role="dialog">create drawer</div> : null,
    ),
  }),
)

vi.mock('@/features/content-source/edit/ui/edit-content-source-drawer', () => ({
  EditContentSourceDrawer: vi.fn(({ open }: { open: boolean }) =>
    open ? <div role="dialog">edit drawer</div> : null,
  ),
}))

const mockedUseContentSourcesQuery = vi.mocked(useContentSourcesQuery)
const mockedUseImportRunEvents = vi.mocked(useImportRunEvents)
const mockedUseImportRunsQuery = vi.mocked(useImportRunsQuery)
const mockedCreateContentSourceDrawer = vi.mocked(CreateContentSourceDrawer)
const mockedEditContentSourceDrawer = vi.mocked(EditContentSourceDrawer)
const mockedContentSourceStatusActions = vi.mocked(ContentSourceStatusActions)
const mockedImportTelegramSourceButton = vi.mocked(ImportTelegramSourceButton)

const telegramSource: ContentSourceResponseDto = {
  channelId: '-100123',
  createdAt: '2026-06-15T10:00:00.000Z',
  displayName: 'Amazing EKB Telegram',
  externalId: 'amazing_ekb',
  handle: 'amazing_ekb',
  id: 'source-telegram-1',
  lastCursor: '{"offset":321}',
  lastImportedAt: '2026-06-16T08:05:30.000Z',
  platform: 'telegram',
  status: 'active',
  updatedAt: '2026-06-16T08:05:30.000Z',
  url: 'https://t.me/amazing_ekb',
}

const dzenSource: ContentSourceResponseDto = {
  ...telegramSource,
  channelId: null,
  displayName: 'Dzen Source',
  externalId: null,
  handle: null,
  id: 'source-dzen-1',
  lastCursor: null,
  lastImportedAt: null,
  platform: 'dzen',
  status: 'disabled',
  url: 'javascript://example.com/%0Aalert(1)',
}

const completedRun: ImportRunResponseDto = {
  createdAt: '2026-06-16T08:00:00.000Z',
  createdCount: 2,
  errorMessage: null,
  finishedAt: '2026-06-16T08:01:00.000Z',
  foundCount: 3,
  id: 'run-1',
  skippedDuplicateCount: 1,
  sourceId: 'source-telegram-1',
  startedAt: '2026-06-16T08:00:00.000Z',
  status: 'completed',
  updatedAt: '2026-06-16T08:01:00.000Z',
  updatedCount: 0,
}

const failedRun: ImportRunResponseDto = {
  ...completedRun,
  createdCount: 0,
  errorMessage: 'Telegram rate limit',
  finishedAt: '2026-06-16T09:01:00.000Z',
  foundCount: 0,
  id: 'run-2',
  sourceId: 'missing-source',
  startedAt: '2026-06-16T09:00:00.000Z',
  status: 'failed',
}

const queuedRun: ImportRunResponseDto = {
  ...completedRun,
  createdCount: 0,
  errorMessage: null,
  finishedAt: null,
  foundCount: 0,
  id: 'run-active',
  skippedDuplicateCount: 0,
  startedAt: null,
  status: 'queued',
  updatedAt: '2026-06-16T09:30:00.000Z',
  updatedCount: 0,
}

const sourcesResponse: ContentSourceListResponseDto = {
  items: [telegramSource, dzenSource],
}

const runsResponse: ImportRunListResponseDto = {
  items: [completedRun, failedRun],
}

const renderScreen = (route = '/content-sources') => {
  render(
    <MemoryRouter initialEntries={[route]}>
      <ContentSourcesScreen />
    </MemoryRouter>,
  )
}

describe('ContentSourcesScreen', () => {
  beforeEach(() => {
    mockedUseContentSourcesQuery.mockReset()
    mockedUseImportRunEvents.mockReset()
    mockedUseImportRunsQuery.mockReset()
    mockedCreateContentSourceDrawer.mockClear()
    mockedEditContentSourceDrawer.mockClear()
    mockedContentSourceStatusActions.mockClear()
    mockedImportTelegramSourceButton.mockClear()
    mockedUseContentSourcesQuery.mockReturnValue({
      data: sourcesResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useContentSourcesQuery>)
    mockedUseImportRunsQuery.mockReturnValue({
      data: runsResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useImportRunsQuery>)
  })

  it('uses URL filters for content source query', () => {
    renderScreen('/content-sources?platform=telegram&status=active')

    expect(mockedUseContentSourcesQuery).toHaveBeenNthCalledWith(1, {
      platform: 'telegram',
      status: 'active',
    })
    expect(mockedUseContentSourcesQuery).toHaveBeenNthCalledWith(2, undefined, {
      enabled: true,
    })
    expect(mockedUseImportRunsQuery).toHaveBeenCalledWith()
  })

  it('renders content source rows, safe links, actions, and import runs', () => {
    renderScreen()

    expect(document.title).toBe('Источники контента | Amazing EKB Admin')
    expect(screen.getByText('Источники контента')).toBeInTheDocument()
    expect(screen.getByText('Всего: 2')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Amazing EKB Telegram' }),
    ).toHaveAttribute('href', 'https://t.me/amazing_ekb')
    expect(screen.getByText('Dzen Source')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Dzen Source' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Активен')).toBeInTheDocument()
    expect(screen.getByText('Отключен')).toBeInTheDocument()
    expect(screen.getByText('2026-06-16 08:05')).toBeInTheDocument()
    expect(
      screen.getByText('status actions for source-telegram-1'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('import action for source-telegram-1 active none'),
    ).toBeInTheDocument()
    expect(screen.getByText('Последние импорты')).toBeInTheDocument()
    expect(screen.getByText('Готово')).toBeInTheDocument()
    expect(screen.getAllByText('Ошибка').length).toBeGreaterThan(1)
    expect(
      screen.getByText('Найдено 3 · Создано 2 · Обновлено 0 · Дубликаты 1'),
    ).toBeInTheDocument()
    expect(screen.getByText('Telegram rate limit')).toBeInTheDocument()
    expect(screen.getByText('missing-source')).toBeInTheDocument()
  })

  it('keeps import run source names from unfiltered source lookup while table is filtered', () => {
    mockedUseContentSourcesQuery
      .mockReturnValueOnce({
        data: { items: [telegramSource] },
        error: null,
        isError: false,
        isFetching: false,
        isPending: false,
      } as unknown as ReturnType<typeof useContentSourcesQuery>)
      .mockReturnValueOnce({
        data: sourcesResponse,
        error: null,
        isError: false,
        isFetching: false,
        isPending: false,
      } as unknown as ReturnType<typeof useContentSourcesQuery>)
    mockedUseImportRunsQuery.mockReturnValue({
      data: {
        items: [
          {
            ...completedRun,
            sourceId: 'source-dzen-1',
          },
        ],
      },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useImportRunsQuery>)

    renderScreen('/content-sources?platform=telegram')

    expect(screen.getByText('Dzen Source')).toBeInTheDocument()
  })

  it('opens create and edit drawers from table actions', () => {
    mockedUseImportRunsQuery.mockReturnValue({
      data: { items: [] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useImportRunsQuery>)

    renderScreen()

    fireEvent.click(screen.getByRole('button', { name: 'Создать источник' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('create drawer')

    fireEvent.click(screen.getAllByRole('button', { name: 'Редактировать' })[0])
    expect(screen.getAllByRole('dialog')[1]).toHaveTextContent('edit drawer')
  })

  it('passes active import runs into row actions and subscribes them to SSE', () => {
    mockedUseImportRunsQuery.mockReturnValue({
      data: { items: [queuedRun, completedRun] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useImportRunsQuery>)

    renderScreen()

    expect(
      screen.getByText('import action for source-telegram-1 active run-active'),
    ).toBeInTheDocument()
    expect(mockedUseImportRunEvents).toHaveBeenCalledWith('run-active', {
      sourceId: 'source-telegram-1',
    })
  })

  it('renders loading, error, and filtered empty states', () => {
    mockedUseContentSourcesQuery.mockReturnValueOnce({
      data: undefined,
      error: null,
      isError: false,
      isFetching: true,
      isPending: true,
    } as unknown as ReturnType<typeof useContentSourcesQuery>)
    mockedUseImportRunsQuery.mockReturnValue({
      data: { items: [] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useImportRunsQuery>)

    renderScreen()

    expect(screen.getByText('Загружаем источники')).toBeInTheDocument()

    mockedUseContentSourcesQuery.mockReturnValueOnce({
      data: undefined,
      error: createApiProblemError('AUTHORIZATION_DENIED', 403),
      isError: true,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useContentSourcesQuery>)

    renderScreen()

    expect(screen.getByText('Доступ запрещен')).toBeInTheDocument()

    mockedUseContentSourcesQuery.mockReturnValueOnce({
      data: { items: [] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof useContentSourcesQuery>)

    renderScreen('/content-sources?platform=telegram')

    expect(
      screen.getByText('По выбранным фильтрам источников не найдено'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Сбросить фильтры' }),
    ).toBeInTheDocument()
  })
})
