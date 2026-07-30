import type {
  ImportRunListResponseDto,
  ImportRunResponseDto,
} from '@/shared/api'
import {
  getAdminContentSourcesListQueryKey,
  getAdminImportRunsListQueryKey,
  getAdminMaterialsListQueryKey,
} from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  IMPORT_RUN_EVENTS_FALLBACK_REFETCH_INTERVAL_MS,
  useImportRunEvents,
} from './import-run-events'

type EventSourceInitWithCredentials = EventSourceInit & {
  withCredentials?: boolean
}

class EventSourceMock {
  static instances: EventSourceMock[] = []

  readonly listeners = new Map<string, Set<EventListener>>()
  readonly close = vi.fn()
  readonly init: EventSourceInitWithCredentials | undefined
  readonly url: string

  constructor(url: string, init?: EventSourceInitWithCredentials) {
    this.url = url
    this.init = init
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
    const event =
      typeof data === 'string'
        ? new MessageEvent(type, { data })
        : new Event(type)

    this.listeners.get(type)?.forEach((listener) => {
      listener(event)
    })
  }
}

const makeRun = (
  overrides: Partial<ImportRunResponseDto>,
): ImportRunResponseDto => ({
  createdAt: '2026-06-24T08:00:00.000Z',
  createdCount: 0,
  errorMessage: null,
  finishedAt: null,
  foundCount: 0,
  id: 'run-1',
  skippedDuplicateCount: 0,
  sourceId: 'source-1',
  startedAt: null,
  status: 'queued',
  updatedAt: '2026-06-24T08:00:00.000Z',
  updatedCount: 0,
  ...overrides,
})

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useImportRunEvents', () => {
  beforeEach(() => {
    EventSourceMock.instances = []
    vi.stubEnv('VITE_API_BASE_URL', '/v1')
    vi.stubGlobal('EventSource', EventSourceMock)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('opens an EventSource connection with credentials', () => {
    const queryClient = new QueryClient()

    renderHook(() => useImportRunEvents('run-1', { sourceId: 'source-1' }), {
      wrapper: createWrapper(queryClient),
    })

    expect(EventSourceMock.instances).toHaveLength(1)
    expect(EventSourceMock.instances[0]?.url).toBe(
      '/v1/admin/import-runs/run-1/events',
    )
    expect(EventSourceMock.instances[0]?.init).toEqual({
      withCredentials: true,
    })
  })

  it('updates import run caches from import-run.updated events and invalidates dependencies on terminal status', async () => {
    const queryClient = new QueryClient()
    const queuedRun = makeRun({ status: 'queued' })
    const completedRun = makeRun({
      createdCount: 3,
      finishedAt: '2026-06-24T08:01:00.000Z',
      foundCount: 3,
      status: 'completed',
    })

    queryClient.setQueryData<ImportRunListResponseDto>(
      getAdminImportRunsListQueryKey(),
      {
        items: [queuedRun],
      },
    )
    queryClient.setQueryData(getAdminContentSourcesListQueryKey(), {
      items: [],
    })
    queryClient.setQueryData(getAdminMaterialsListQueryKey(), {
      items: [],
    })

    renderHook(() => useImportRunEvents('run-1', { sourceId: 'source-1' }), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      EventSourceMock.instances[0]?.emit(
        'import-run.updated',
        JSON.stringify(completedRun),
      )
      await Promise.resolve()
    })

    expect(
      queryClient.getQueryData<ImportRunListResponseDto>(
        getAdminImportRunsListQueryKey(),
      )?.items,
    ).toEqual([completedRun])
    expect(EventSourceMock.instances[0]?.close).toHaveBeenCalled()
    expect(
      queryClient.getQueryCache().find({
        queryKey: getAdminContentSourcesListQueryKey(),
      })?.state.isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({
        queryKey: getAdminMaterialsListQueryKey(),
      })?.state.isInvalidated,
    ).toBe(true)
  })

  it('falls back to import-run refetch when SSE emits an error', () => {
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useImportRunEvents('run-1', { sourceId: 'source-1' }), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      EventSourceMock.instances[0]?.emit('error')
    })

    expect(EventSourceMock.instances[0]?.close).toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: getAdminImportRunsListQueryKey(),
    })

    act(() => {
      vi.advanceTimersByTime(IMPORT_RUN_EVENTS_FALLBACK_REFETCH_INTERVAL_MS)
    })

    expect(invalidateSpy).toHaveBeenCalledTimes(2)
  })

  it('falls back to import-run refetch when an event payload is malformed', () => {
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useImportRunEvents('run-1', { sourceId: 'source-1' }), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      EventSourceMock.instances[0]?.emit('import-run.updated', '{broken')
    })

    expect(EventSourceMock.instances[0]?.close).toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: getAdminImportRunsListQueryKey(),
    })
  })

  it('falls back to import-run refetch when an event payload violates the generated schema', () => {
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useImportRunEvents('run-1', { sourceId: 'source-1' }), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      EventSourceMock.instances[0]?.emit(
        'import-run.updated',
        JSON.stringify({ id: 'run-1', status: 'completed' }),
      )
    })

    expect(EventSourceMock.instances[0]?.close).toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: getAdminImportRunsListQueryKey(),
    })
  })

  it('uses fallback refetch when EventSource is unavailable', () => {
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.stubGlobal('EventSource', undefined)

    renderHook(() => useImportRunEvents('run-1', { sourceId: 'source-1' }), {
      wrapper: createWrapper(queryClient),
    })

    expect(EventSourceMock.instances).toHaveLength(0)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: getAdminImportRunsListQueryKey(),
    })
  })
})
