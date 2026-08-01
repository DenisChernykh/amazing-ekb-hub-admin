import { buildApiUrl } from '@/shared/api'

/**
 * Имя успешного SSE-события обновления import run.
 */
export const IMPORT_RUN_UPDATED_EVENT = 'import-run.updated'

/**
 * Callback-и transport-подписки на SSE-события import run.
 */
export type ImportRunEventsHandlers = {
  onError: () => void
  onUpdate: (data: string) => void
}

/**
 * Активная transport-подписка на SSE-события import run.
 */
export type ImportRunEventsSubscription = {
  close: () => void
}

/**
 * Открывает native `EventSource` stream для одного import run.
 *
 * @remarks Transport layer знает только URL, credentials, named event и cleanup;
 * parsing payload и React Query cache updates остаются в entity model layer.
 */
export const subscribeToImportRunEvents = (
  runId: string,
  handlers: ImportRunEventsHandlers,
): ImportRunEventsSubscription => {
  let isClosed = false
  const eventSource = new EventSource(
    buildApiUrl(`/v1/admin/import-runs/${encodeURIComponent(runId)}/events`),
    {
      withCredentials: true,
    },
  )
  const close = () => {
    if (isClosed) {
      return
    }

    isClosed = true
    eventSource.removeEventListener(IMPORT_RUN_UPDATED_EVENT, handleUpdate)
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

  eventSource.addEventListener(IMPORT_RUN_UPDATED_EVENT, handleUpdate)
  eventSource.addEventListener('error', handleError)

  return {
    close,
  }
}
