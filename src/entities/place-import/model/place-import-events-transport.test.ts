import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PLACE_IMPORT_UPDATED_EVENT,
  subscribeToPlaceImportEvents,
} from './place-import-events-transport'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: '/' },
}))

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
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

describe('subscribeToPlaceImportEvents', () => {
  beforeEach(async () => {
    EventSourceMock.instances = []
    vi.stubGlobal('EventSource', EventSourceMock)
    const { buildApiUrl } = await import('@/shared/api')
    vi.mocked(buildApiUrl).mockImplementation((path) =>
      joinTestApiUrl('/', path),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('opens a same-origin versioned stream with credentials and cursor', () => {
    subscribeToPlaceImportEvents('operation / 1', 7, {
      onError: vi.fn(),
      onUpdate: vi.fn(),
    })

    expect(EventSourceMock.instances[0]?.url).toBe(
      '/v1/admin/place-imports/operation%20%2F%201/events/stream?afterVersion=7',
    )
    expect(EventSourceMock.instances[0]?.withCredentials).toBe(true)
  })

  it('opens an absolute-origin versioned stream', async () => {
    const { buildApiUrl } = await import('@/shared/api')
    vi.mocked(buildApiUrl).mockImplementation((path) =>
      joinTestApiUrl('https://api.example.test', path),
    )

    subscribeToPlaceImportEvents('operation-1', 3, {
      onError: vi.fn(),
      onUpdate: vi.fn(),
    })

    expect(EventSourceMock.instances[0]?.url).toBe(
      'https://api.example.test/v1/admin/place-imports/operation-1/events/stream?afterVersion=3',
    )
  })

  it('wires the named event and closes idempotently', () => {
    const onError = vi.fn()
    const onUpdate = vi.fn()
    const subscription = subscribeToPlaceImportEvents('operation-1', 3, {
      onError,
      onUpdate,
    })

    EventSourceMock.instances[0]?.emit(
      PLACE_IMPORT_UPDATED_EVENT,
      '{"operation":{"id":"operation-1"}}',
    )
    EventSourceMock.instances[0]?.emit('error')
    subscription.close()
    subscription.close()
    EventSourceMock.instances[0]?.emit(
      PLACE_IMPORT_UPDATED_EVENT,
      '{"operation":{"id":"operation-1-after-close"}}',
    )

    expect(onUpdate).toHaveBeenCalledWith('{"operation":{"id":"operation-1"}}')
    expect(onUpdate).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledOnce()
    expect(EventSourceMock.instances[0]?.close).toHaveBeenCalledOnce()
  })
})
