import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  IMPORT_RUN_UPDATED_EVENT,
  subscribeToImportRunEvents,
} from './import-run-events-transport'

vi.mock('@/shared/api/client/api-base-url', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/shared/api/client/api-base-url')
  >()),
  buildApiUrl: vi.fn(),
}))

const joinTestApiUrl = (baseUrl: string, path: string) =>
  baseUrl === '/' ? path : `${baseUrl}${path}`

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

describe('subscribeToImportRunEvents', () => {
  beforeEach(async () => {
    EventSourceMock.instances = []
    vi.stubGlobal('EventSource', EventSourceMock)
    const { buildApiUrl } = await import('@/shared/api/client/api-base-url')
    vi.mocked(buildApiUrl).mockImplementation((path) =>
      joinTestApiUrl('/', path),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('opens a same-origin versioned stream with credentials', () => {
    subscribeToImportRunEvents('run / 1', {
      onError: vi.fn(),
      onUpdate: vi.fn(),
    })

    expect(EventSourceMock.instances[0]?.url).toBe(
      '/v1/admin/import-runs/run%20%2F%201/events',
    )
    expect(EventSourceMock.instances[0]?.withCredentials).toBe(true)
  })

  it('opens an absolute-origin versioned stream', async () => {
    const { buildApiUrl } = await import('@/shared/api/client/api-base-url')
    vi.mocked(buildApiUrl).mockImplementation((path) =>
      joinTestApiUrl('https://api.example.test', path),
    )

    subscribeToImportRunEvents('run-1', {
      onError: vi.fn(),
      onUpdate: vi.fn(),
    })

    expect(EventSourceMock.instances[0]?.url).toBe(
      'https://api.example.test/v1/admin/import-runs/run-1/events',
    )
  })

  it('wires the named event and closes idempotently', () => {
    const onError = vi.fn()
    const onUpdate = vi.fn()
    const subscription = subscribeToImportRunEvents('run-1', {
      onError,
      onUpdate,
    })

    EventSourceMock.instances[0]?.emit(
      IMPORT_RUN_UPDATED_EVENT,
      '{"id":"run-1"}',
    )
    EventSourceMock.instances[0]?.emit('error')
    subscription.close()
    subscription.close()
    EventSourceMock.instances[0]?.emit(
      IMPORT_RUN_UPDATED_EVENT,
      '{"id":"run-1-after-close"}',
    )

    expect(onUpdate).toHaveBeenCalledWith('{"id":"run-1"}')
    expect(onUpdate).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledOnce()
    expect(EventSourceMock.instances[0]?.close).toHaveBeenCalledOnce()
  })
})
