import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  getImportRunFromQueryCache,
  invalidateImportRunDependencyQueries,
  invalidateImportRunQueries,
  isTerminalImportRunStatus,
  syncImportRunQueryCache,
} from './import-run-cache'
import { parseImportRunEventData } from './import-run-events-parser'
import {
  subscribeToImportRunEvents,
  type ImportRunEventsSubscription,
} from './import-run-events-transport'

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

    let subscription: ImportRunEventsSubscription | null = null
    const enableFallback = () => {
      subscription?.close()
      setFallbackRunId(runId)
    }
    subscription = subscribeToImportRunEvents(runId, {
      onError: enableFallback,
      onUpdate: (data) => {
        try {
          const importRun = parseImportRunEventData(data)
          const isTerminal = isTerminalImportRunStatus(importRun.status)

          syncImportRunQueryCache(queryClient, importRun)

          if (isTerminal) {
            void invalidateImportRunDependencyQueries(queryClient)
            subscription?.close()
          }
        } catch {
          enableFallback()
        }
      },
    })
    return () => {
      subscription.close()
    }
  }, [enabled, fallbackRunId, isEventSourceUnavailable, queryClient, runId])

  useEffect(() => {
    if (!enabled || !runId || !isFallbackRefetchEnabled) {
      return
    }

    const refetchImportRuns = async () => {
      await invalidateImportRunQueries(queryClient)

      const importRun = getImportRunFromQueryCache(queryClient, runId)

      if (importRun && isTerminalImportRunStatus(importRun.status)) {
        await invalidateImportRunDependencyQueries(queryClient)
      }
    }

    void refetchImportRuns()

    const intervalId = window.setInterval(() => {
      void refetchImportRuns()
    }, IMPORT_RUN_EVENTS_FALLBACK_REFETCH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [enabled, isFallbackRefetchEnabled, queryClient, runId])

  return {
    isFallbackRefetchEnabled,
  }
}
