import { buildApiUrl } from '@/shared/api/client/api-base-url'
import type { ImportRun, ImportRunStatus } from '@/shared/api/generated/model'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  invalidateImportRunQueries,
  isTerminalImportRunStatus,
  syncImportRunQueryCache,
} from './import-run-cache'

/**
 * Имя успешного SSE-события обновления import run.
 */
export const IMPORT_RUN_UPDATED_EVENT = 'import-run.updated'

/**
 * Интервал fallback refetch, пока SSE недоступен или сломан.
 */
export const IMPORT_RUN_EVENTS_FALLBACK_REFETCH_INTERVAL_MS = 5_000

/**
 * Options подписки на SSE-события import run.
 */
export type ImportRunEventsOptions = {
  enabled?: boolean
  sourceId?: string
}

/**
 * Состояние SSE-подписки import run.
 */
export type ImportRunEventsState = {
  isFallbackRefetchEnabled: boolean
}

const importRunStatuses = new Set<ImportRunStatus>([
  'queued',
  'running',
  'completed',
  'failed',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNullableString = (value: unknown): value is string | null =>
  typeof value === 'string' || value === null

const isImportRun = (value: unknown): value is ImportRun => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.sourceId === 'string' &&
    typeof value.status === 'string' &&
    importRunStatuses.has(value.status as ImportRunStatus) &&
    isNullableString(value.startedAt) &&
    isNullableString(value.finishedAt) &&
    typeof value.foundCount === 'number' &&
    typeof value.createdCount === 'number' &&
    typeof value.updatedCount === 'number' &&
    typeof value.skippedDuplicateCount === 'number' &&
    isNullableString(value.errorMessage) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

const parseImportRunEventData = (data: string) => {
  const parsed: unknown = JSON.parse(data)

  if (!isImportRun(parsed)) {
    throw new Error('Unexpected import run SSE payload')
  }

  return parsed
}

/**
 * Подписывается на backend SSE stream одного import run и синхронизирует React Query cache.
 *
 * @remarks `useEffect` здесь синхронизирует внешний browser API `EventSource`;
 * обычный React Query hook не подходит, потому что endpoint держит `text/event-stream`.
 * При ошибке подписки hook включает fallback invalidation/polling durable `GET /admin/import-runs`.
 */
export function useImportRunEvents(
  runId: string | null | undefined,
  options?: ImportRunEventsOptions,
): ImportRunEventsState {
  const queryClient = useQueryClient()
  const enabled = (options?.enabled ?? true) && Boolean(runId)
  const [fallbackRunId, setFallbackRunId] = useState<string | null>(null)
  const isEventSourceUnavailable = typeof EventSource === 'undefined'
  const isFallbackRefetchEnabled =
    enabled &&
    Boolean(runId) &&
    (isEventSourceUnavailable || fallbackRunId === runId)

  useEffect(() => {
    if (
      !enabled ||
      !runId ||
      isEventSourceUnavailable ||
      fallbackRunId === runId
    ) {
      return
    }

    let isClosed = false
    const eventSource = new EventSource(
      buildApiUrl(`/admin/import-runs/${encodeURIComponent(runId)}/events`),
      {
        withCredentials: true,
      },
    )
    const closeEventSource = () => {
      if (isClosed) {
        return
      }

      isClosed = true
      eventSource.close()
    }
    const enableFallback = () => {
      closeEventSource()
      setFallbackRunId(runId)
    }
    const handleUpdate = (event: Event) => {
      try {
        const importRun = parseImportRunEventData(
          (event as MessageEvent<string>).data,
        )

        syncImportRunQueryCache(queryClient, importRun)

        if (isTerminalImportRunStatus(importRun.status)) {
          closeEventSource()
        }
      } catch {
        enableFallback()
      }
    }
    const handleError = () => {
      enableFallback()
    }

    eventSource.addEventListener(IMPORT_RUN_UPDATED_EVENT, handleUpdate)
    eventSource.addEventListener('error', handleError)

    return () => {
      eventSource.removeEventListener(IMPORT_RUN_UPDATED_EVENT, handleUpdate)
      eventSource.removeEventListener('error', handleError)
      closeEventSource()
    }
  }, [enabled, fallbackRunId, isEventSourceUnavailable, queryClient, runId])

  useEffect(() => {
    if (!enabled || !runId || !isFallbackRefetchEnabled) {
      return
    }

    void invalidateImportRunQueries(queryClient)

    const intervalId = window.setInterval(() => {
      void invalidateImportRunQueries(queryClient)
    }, IMPORT_RUN_EVENTS_FALLBACK_REFETCH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [enabled, isFallbackRefetchEnabled, queryClient, runId])

  return {
    isFallbackRefetchEnabled,
  }
}
