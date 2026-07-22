import { buildApiUrl } from '@/shared/api/client/api-base-url'

/** Именованное событие backend stream операции импорта места. */
export const PLACE_IMPORT_UPDATED_EVENT = 'place-import.updated'

/** Callback-и browser transport подписки. */
export type PlaceImportEventsHandlers = {
  onError: () => void
  onUpdate: (data: string) => void
}

/** Управляемая подписка на SSE операции импорта. */
export type PlaceImportEventsSubscription = {
  close: () => void
}

/** Открывает credentialed EventSource с reconnect cursor по версии operation. */
export function subscribeToPlaceImportEvents(
  operationId: string,
  afterVersion: number,
  handlers: PlaceImportEventsHandlers,
): PlaceImportEventsSubscription {
  const search = new URLSearchParams({ afterVersion: String(afterVersion) })
  const eventSource = new EventSource(
    buildApiUrl(
      `/admin/place-imports/${encodeURIComponent(operationId)}/events/stream?${search.toString()}`,
    ),
    { withCredentials: true },
  )
  let isClosed = false

  const close = () => {
    if (isClosed) return

    isClosed = true
    eventSource.removeEventListener(PLACE_IMPORT_UPDATED_EVENT, handleUpdate)
    eventSource.removeEventListener('error', handleError)
    eventSource.close()
  }
  const handleUpdate: EventListener = (event) => {
    if (event instanceof MessageEvent && typeof event.data === 'string') {
      handlers.onUpdate(event.data)
    }
  }
  const handleError = () => {
    handlers.onError()
  }

  eventSource.addEventListener(PLACE_IMPORT_UPDATED_EVENT, handleUpdate)
  eventSource.addEventListener('error', handleError)

  return { close }
}
