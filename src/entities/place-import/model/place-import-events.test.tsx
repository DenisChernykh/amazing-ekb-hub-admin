import type { PlaceImportOperationResponseDto } from '@/shared/api'
import {
  adminPlaceImportsGetEvents,
  ApiNetworkError,
  getAdminCategoriesListQueryKey,
  getAdminPlaceImportsGetQueryKey,
  getAdminPlacesListQueryKey,
} from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PLACE_IMPORT_POLL_INTERVAL_MS,
  usePlaceImportEvents,
} from './place-import-hooks'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: '/' },
}))

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  getAdminPlaceImportsGetQueryKey: vi.fn(({ operationId }) => [
    `/v1/admin/place-imports/${operationId}`,
  ]),
  getAdminCategoriesListQueryKey: vi.fn(() => ['/v1/admin/categories']),
  getAdminPlacesListQueryKey: vi.fn(() => ['/v1/admin/places']),
  adminPlaceImportsGetEvents: vi.fn(),
}))

class EventSourceMock {
  static instances: EventSourceMock[] = []
  readonly close = vi.fn()
  readonly listeners = new Map<string, Set<EventListener>>()
  readonly url: string
  readonly withCredentials: boolean | undefined

  constructor(url: string, init?: EventSourceInit) {
    this.url = url
    this.withCredentials = init?.withCredentials
    EventSourceMock.instances.push(this)
  }

  addEventListener(type: string, listener: EventListener) {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners.get(type)?.delete(listener)
  }

  emit(type: string, data?: string) {
    const event = data ? new MessageEvent(type, { data }) : new Event(type)
    this.listeners.get(type)?.forEach((listener) => listener(event))
  }
}

const operation = (
  overrides: Partial<PlaceImportOperationResponseDto> = {},
): PlaceImportOperationResponseDto => ({
  attempt: 0,
  captchaExpiresAt: null,
  category: null,
  createdAt: '2026-07-22T10:00:00.000Z',
  error: null,
  id: 'operation-1',
  mapsUrl: null,
  organizationId: null,
  outcome: null,
  possibleDuplicate: null,
  previewExpiresAt: null,
  resultPlaceId: null,
  sourceUrl: 'https://yandex.ru/maps/org/test/1',
  status: 'queued',
  title: null,
  updatedAt: '2026-07-22T10:00:00.000Z',
  version: 1,
  ...overrides,
})

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

describe('usePlaceImportEvents', () => {
  beforeEach(() => {
    EventSourceMock.instances = []
    vi.mocked(adminPlaceImportsGetEvents).mockReset()
    vi.stubGlobal('EventSource', EventSourceMock)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('opens credentialed SSE with the reload cursor and closes on terminal update', async () => {
    const queryClient = new QueryClient()
    const queued = operation({ version: 4 })
    queryClient.setQueryData(
      getAdminPlaceImportsGetQueryKey({ operationId: queued.id }),
      queued,
    )
    queryClient.setQueryData(getAdminPlacesListQueryKey(), { items: [] })
    queryClient.setQueryData(getAdminCategoriesListQueryKey(), {
      items: [],
    })

    renderHook(() => usePlaceImportEvents(queued), {
      wrapper: createWrapper(queryClient),
    })

    expect(EventSourceMock.instances[0]?.url).toMatch(
      /\/v1\/admin\/place-imports\/operation-1\/events\/stream\?afterVersion=4$/u,
    )
    expect(EventSourceMock.instances[0]?.withCredentials).toBe(true)

    const completed = operation({
      outcome: 'created',
      resultPlaceId: 'place-1',
      status: 'completed',
      version: 5,
    })
    await act(async () => {
      EventSourceMock.instances[0]?.emit(
        'place-import.updated',
        JSON.stringify({ events: [], operation: completed }),
      )
      await Promise.resolve()
    })

    expect(EventSourceMock.instances[0]?.close).toHaveBeenCalled()
    expect(
      queryClient.getQueryData(
        getAdminPlaceImportsGetQueryKey({ operationId: completed.id }),
      ),
    ).toEqual(completed)
    expect(
      queryClient.getQueryCache().find({
        queryKey: getAdminCategoriesListQueryKey(),
      })?.state.isInvalidated,
    ).toBe(true)
  })

  it('switches to polling fallback and advances afterVersion', async () => {
    const queryClient = new QueryClient()
    const queued = operation({ version: 2 })
    queryClient.setQueryData(
      getAdminPlaceImportsGetQueryKey({ operationId: queued.id }),
      queued,
    )
    vi.mocked(adminPlaceImportsGetEvents)
      .mockResolvedValueOnce({
        events: [],
        operation: operation({ version: 3 }),
      })
      .mockResolvedValueOnce({
        events: [],
        operation: operation({ status: 'failed', version: 4 }),
      })

    const { rerender, result } = renderHook(
      ({ currentOperation }) => usePlaceImportEvents(currentOperation),
      {
        initialProps: { currentOperation: queued },
        wrapper: createWrapper(queryClient),
      },
    )

    await act(async () => {
      EventSourceMock.instances[0]?.emit('error')
      await Promise.resolve()
    })
    expect(result.current.isPollingFallback).toBe(true)
    expect(adminPlaceImportsGetEvents).toHaveBeenCalledWith(
      { operationId: 'operation-1' },
      { afterVersion: 2 },
      undefined,
      expect.any(AbortSignal),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PLACE_IMPORT_POLL_INTERVAL_MS)
    })
    expect(adminPlaceImportsGetEvents).toHaveBeenLastCalledWith(
      { operationId: 'operation-1' },
      { afterVersion: 3 },
      undefined,
      expect.any(AbortSignal),
    )
    rerender({ currentOperation: operation({ status: 'failed', version: 4 }) })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PLACE_IMPORT_POLL_INTERVAL_MS * 2)
    })
    expect(adminPlaceImportsGetEvents).toHaveBeenCalledTimes(2)
  })

  it('aborts an in-flight polling request when the operation becomes terminal', async () => {
    const queryClient = new QueryClient()
    const queued = operation({ version: 2 })
    queryClient.setQueryData(
      getAdminPlaceImportsGetQueryKey({ operationId: queued.id }),
      queued,
    )
    vi.mocked(adminPlaceImportsGetEvents).mockReturnValue(new Promise(() => {}))
    const { rerender } = renderHook(
      ({ currentOperation }) => usePlaceImportEvents(currentOperation),
      {
        initialProps: { currentOperation: queued },
        wrapper: createWrapper(queryClient),
      },
    )

    await act(async () => {
      EventSourceMock.instances[0]?.emit('error')
      await Promise.resolve()
    })
    const pollingSignal = vi.mocked(adminPlaceImportsGetEvents).mock
      .calls[0]?.[3]
    expect(pollingSignal?.aborted).toBe(false)

    rerender({ currentOperation: operation({ status: 'failed', version: 3 }) })

    expect(pollingSignal?.aborted).toBe(true)
  })

  it('does not open realtime channels for a terminal snapshot', () => {
    const queryClient = new QueryClient()

    const { result } = renderHook(
      () => usePlaceImportEvents(operation({ status: 'cancelled' })),
      { wrapper: createWrapper(queryClient) },
    )

    expect(EventSourceMock.instances).toHaveLength(0)
    expect(result.current.isPollingFallback).toBe(false)
    expect(adminPlaceImportsGetEvents).not.toHaveBeenCalled()
  })

  it('exposes polling errors and clears them after a successful retry', async () => {
    const queryClient = new QueryClient()
    const queued = operation({ version: 2 })
    queryClient.setQueryData(
      getAdminPlaceImportsGetQueryKey({ operationId: queued.id }),
      queued,
    )
    vi.mocked(adminPlaceImportsGetEvents)
      .mockRejectedValueOnce(new ApiNetworkError())
      .mockResolvedValueOnce({
        events: [],
        operation: operation({ version: 3 }),
      })
    const { result } = renderHook(() => usePlaceImportEvents(queued), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      EventSourceMock.instances[0]?.emit('error')
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(result.current.pollingErrorMessage).toBe(
      'Не удалось подключиться к серверу.',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PLACE_IMPORT_POLL_INTERVAL_MS)
    })
    expect(result.current.pollingErrorMessage).toBeNull()
  })

  it('hides a polling error after the operation becomes terminal', async () => {
    const queryClient = new QueryClient()
    const queued = operation({ version: 2 })
    queryClient.setQueryData(
      getAdminPlaceImportsGetQueryKey({ operationId: queued.id }),
      queued,
    )
    vi.mocked(adminPlaceImportsGetEvents).mockRejectedValueOnce(
      new ApiNetworkError(),
    )
    const { rerender, result } = renderHook(
      ({ currentOperation }) => usePlaceImportEvents(currentOperation),
      {
        initialProps: { currentOperation: queued },
        wrapper: createWrapper(queryClient),
      },
    )

    await act(async () => {
      EventSourceMock.instances[0]?.emit('error')
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(result.current.pollingErrorMessage).toBe(
      'Не удалось подключиться к серверу.',
    )

    rerender({
      currentOperation: operation({ status: 'cancelled', version: 3 }),
    })

    expect(result.current.isPollingFallback).toBe(false)
    expect(result.current.pollingErrorMessage).toBeNull()
  })
})
