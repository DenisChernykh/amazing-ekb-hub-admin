import { useCollectionDetailQuery } from '@/entities/collection/model/collection-hooks'
import {
  useActivePlaceImportQuery,
  usePlaceImportEvents,
  usePlaceImportOperationQuery,
} from '@/entities/place-import/model/place-import-hooks'
import type { PlaceImportOperationResponseDto } from '@/shared/api'
import { createApiProblemError } from '@/test/api-problem'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceImportYandexScreen } from './place-import-yandex-screen'

vi.mock('@/entities/place-import/model/place-import-hooks', () => ({
  useActivePlaceImportQuery: vi.fn(),
  usePlaceImportEvents: vi.fn(() => ({
    isPollingFallback: false,
    pollingErrorMessage: null,
  })),
  usePlaceImportOperationQuery: vi.fn(),
}))

vi.mock('@/entities/collection/model/collection-hooks', () => ({
  useCollectionDetailQuery: vi.fn(),
}))

vi.mock('@/features/place/import-yandex/ui/place-import-actions', () => ({
  PlaceImportActions: () => <div>Actions</div>,
}))

vi.mock('@/features/place/import-yandex/ui/place-import-start-form', () => ({
  PlaceImportStartForm: ({
    targetCollectionId,
    targetCollectionTitle,
  }: {
    targetCollectionId?: string
    targetCollectionTitle?: string
  }) => (
    <div>
      <button>Начать импорт</button>
      {targetCollectionId && <span>{targetCollectionId}</span>}
      {targetCollectionTitle && <span>{targetCollectionTitle}</span>}
    </div>
  ),
}))

const completedOperation = (
  outcome: PlaceImportOperationResponseDto['outcome'],
): PlaceImportOperationResponseDto => ({
  attempt: 1,
  captchaExpiresAt: null,
  category: null,
  createdAt: '2026-07-22T10:00:00.000Z',
  error: null,
  id: 'operation-1',
  mapsUrl: 'https://yandex.ru/maps/org/spa/1',
  organizationId: '1',
  outcome,
  possibleDuplicate: null,
  previewExpiresAt: null,
  resultPlaceId: 'place-result',
  sourceUrl: 'https://yandex.ru/maps/org/spa/1',
  status: 'completed',
  targetCollection: null,
  title: 'SPA',
  updatedAt: '2026-07-22T10:02:00.000Z',
  version: 4,
})

const queuedOperation = (
  id = 'operation-active',
): PlaceImportOperationResponseDto => ({
  ...completedOperation(null),
  id,
  outcome: null,
  resultPlaceId: null,
  status: 'queued',
  version: 1,
})

const mockActiveQuery = (
  value: Partial<ReturnType<typeof useActivePlaceImportQuery>>,
) => {
  vi.mocked(useActivePlaceImportQuery).mockReturnValue({
    data: undefined,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: false,
    ...value,
  } as ReturnType<typeof useActivePlaceImportQuery>)
}

const renderBaseRoute = (initialEntry = '/places/import/yandex') => {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          element={<PlaceImportYandexScreen />}
          path="/places/import/yandex"
        />
        <Route
          element={<div>Recovered operation</div>}
          path="/places/import/yandex/:operationId"
        />
      </Routes>
    </MemoryRouter>,
  )
}

function RecoveredOperationRoute() {
  const navigate = useNavigate()

  return (
    <>
      <div>Recovered operation</div>
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  )
}

const renderCompleted = (
  outcome: PlaceImportOperationResponseDto['outcome'],
) => {
  vi.mocked(usePlaceImportOperationQuery).mockReturnValue({
    data: completedOperation(outcome),
    isError: false,
    isPending: false,
  } as ReturnType<typeof usePlaceImportOperationQuery>)
  vi.mocked(usePlaceImportEvents).mockReturnValue({
    isPollingFallback: false,
    pollingErrorMessage: null,
  })

  render(
    <MemoryRouter initialEntries={['/places/import/yandex/operation-1']}>
      <Routes>
        <Route
          element={<PlaceImportYandexScreen operationId="operation-1" />}
          path="/places/import/yandex/:operationId"
        />
        <Route element={<div>Result place</div>} path="/places/:placeId" />
      </Routes>
    </MemoryRouter>,
  )
}

const renderCompletedTargeted = () => {
  vi.mocked(usePlaceImportOperationQuery).mockReturnValue({
    data: {
      ...completedOperation('created'),
      targetCollection: { id: 'collection-1', slug: 'spa', title: 'SPA' },
    },
    isError: false,
    isPending: false,
  } as ReturnType<typeof usePlaceImportOperationQuery>)
  vi.mocked(usePlaceImportEvents).mockReturnValue({
    isPollingFallback: false,
    pollingErrorMessage: null,
  })
  render(
    <MemoryRouter initialEntries={['/places/import/yandex/operation-1']}>
      <Routes>
        <Route
          element={<PlaceImportYandexScreen operationId="operation-1" />}
          path="/places/import/yandex/:operationId"
        />
        <Route
          element={<div>Collection result</div>}
          path="/collections/:collectionId"
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PlaceImportYandexScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCollectionDetailQuery).mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: false,
    } as never)
    vi.mocked(usePlaceImportEvents).mockReturnValue({
      isPollingFallback: false,
      pollingErrorMessage: null,
    })
  })

  it('shows a loading state while active import lookup is pending', () => {
    mockActiveQuery({ isPending: true })

    renderBaseRoute()

    expect(screen.getByText('Проверяем активный импорт')).toBeInTheDocument()
  })

  it('redirects with replace when an active import exists', () => {
    mockActiveQuery({
      data: queuedOperation('operation-existing'),
      isSuccess: true,
    })

    render(
      <MemoryRouter
        initialEntries={['/places', '/places/import/yandex']}
        initialIndex={1}
      >
        <Routes>
          <Route element={<div>Places list</div>} path="/places" />
          <Route
            element={<PlaceImportYandexScreen />}
            path="/places/import/yandex"
          />
          <Route
            element={<RecoveredOperationRoute />}
            path="/places/import/yandex/:operationId"
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Recovered operation')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Places list')).toBeInTheDocument()
  })

  it('renders the start form when active lookup returns 404', () => {
    mockActiveQuery({
      error: createApiProblemError('PLACE_IMPORT_NOT_FOUND', 404),
      isError: true,
    })

    renderBaseRoute()

    expect(
      screen.getByRole('button', { name: 'Начать импорт' }),
    ).toBeInTheDocument()
  })

  it('waits for the requested target collection before enabling targeted import', () => {
    mockActiveQuery({
      error: createApiProblemError('PLACE_IMPORT_NOT_FOUND', 404),
      isError: true,
    })
    vi.mocked(useCollectionDetailQuery).mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isPending: true,
      isSuccess: false,
    } as never)

    renderBaseRoute('/places/import/yandex?collectionId=collection-1')

    expect(screen.getByText('Проверяем целевую подборку')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Начать импорт' }),
    ).not.toBeInTheDocument()
  })

  it('passes a targeted collection only after its lookup succeeds', () => {
    mockActiveQuery({
      error: createApiProblemError('PLACE_IMPORT_NOT_FOUND', 404),
      isError: true,
    })
    vi.mocked(useCollectionDetailQuery).mockReturnValue({
      data: { id: 'collection-1', title: 'SPA' },
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
    } as never)

    renderBaseRoute('/places/import/yandex?collectionId=collection-1')

    expect(screen.getByRole('button', { name: 'Начать импорт' })).toBeEnabled()
    expect(screen.getByText('collection-1')).toBeInTheDocument()
    expect(screen.getByText('SPA')).toBeInTheDocument()
  })

  it('shows the target lookup error instead of starting an unverified import', () => {
    mockActiveQuery({
      error: createApiProblemError('PLACE_IMPORT_NOT_FOUND', 404),
      isError: true,
    })
    vi.mocked(useCollectionDetailQuery).mockReturnValue({
      data: undefined,
      error: createApiProblemError('COLLECTION_NOT_FOUND', 404),
      isError: true,
      isPending: false,
      isSuccess: false,
    } as never)

    renderBaseRoute('/places/import/yandex?collectionId=missing')

    expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Начать импорт' }),
    ).not.toBeInTheDocument()
  })

  it('renders the API error state when active lookup fails with a non-404 error', () => {
    mockActiveQuery({
      error: createApiProblemError('DEPENDENCY_UNAVAILABLE', 503),
      isError: true,
    })

    renderBaseRoute()

    expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument()
    expect(screen.getByText('Сервис временно недоступен.')).toBeInTheDocument()
    expect(screen.queryByText('Raw backend title')).toBeNull()
  })

  it('keeps an explicit operation route on snapshot plus realtime flow', () => {
    vi.mocked(usePlaceImportOperationQuery).mockReturnValue({
      data: queuedOperation('operation-route'),
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlaceImportOperationQuery>)

    render(
      <MemoryRouter initialEntries={['/places/import/yandex/operation-route']}>
        <Routes>
          <Route
            element={<PlaceImportYandexScreen operationId="operation-route" />}
            path="/places/import/yandex/:operationId"
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(useActivePlaceImportQuery).not.toHaveBeenCalled()
    expect(usePlaceImportOperationQuery).toHaveBeenCalledWith('operation-route')
    expect(usePlaceImportEvents).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'operation-route' }),
    )
  })

  it('navigates a newly created hidden place to admin detail', () => {
    renderCompleted('created')
    expect(screen.getByText('Result place')).toBeInTheDocument()
  })

  it('navigates a strict external-identity duplicate to the existing place', () => {
    renderCompleted('already_exists')
    expect(screen.getByText('Result place')).toBeInTheDocument()
  })

  it('redirects targeted completion to durable collection and highlights result place', () => {
    renderCompletedTargeted()
    expect(screen.getByText('Collection result')).toBeInTheDocument()
  })
})
