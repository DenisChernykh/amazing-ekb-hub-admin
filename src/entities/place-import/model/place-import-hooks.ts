import type { PlaceImportOperationResponseDto } from '@/shared/api'
import {
  adminPlaceImportsGet,
  adminPlaceImportsGetActive,
  adminPlaceImportsGetEvents,
  getAdminPlaceImportsGetQueryKey,
} from '@/shared/api'
import {
  normalizeApiError,
  type ApiClientError,
} from '@/shared/api/client/api-error'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  invalidatePlaceImportResultQueries,
  isTerminalPlaceImportStatus,
  syncPlaceImportOperationCache,
} from './place-import-cache'
import { parsePlaceImportEventData } from './place-import-events-parser'
import {
  subscribeToPlaceImportEvents,
  type PlaceImportEventsSubscription,
} from './place-import-events-transport'

/** Интервал durable polling fallback после недоступности SSE. */
export const PLACE_IMPORT_POLL_INTERVAL_MS = 5_000

/** Загружает operation snapshot для reload/resume route. */
export function usePlaceImportOperationQuery(operationId: string) {
  return useQuery<PlaceImportOperationResponseDto, ApiClientError>({
    enabled: Boolean(operationId),
    queryFn: ({ signal }) =>
      adminPlaceImportsGet({ operationId }, undefined, signal),
    queryKey: getAdminPlaceImportsGetQueryKey({ operationId }),
  })
}

/** Однократно ищет активную operation для одного входа на стартовый route импорта. */
export function useActivePlaceImportQuery(routeEntryKey: string) {
  return useQuery<PlaceImportOperationResponseDto, ApiClientError>({
    queryFn: () => adminPlaceImportsGetActive(),
    queryKey: ['/admin/place-imports/active', routeEntryKey],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  })
}

/** Состояние realtime-синхронизации операции. */
export type PlaceImportEventsState = {
  isPollingFallback: boolean
  pollingErrorMessage: string | null
}

/**
 * Синхронизирует operation через SSE и включает polling journal при ошибке transport.
 *
 * @remarks `useEffect` необходим для browser `EventSource` и interval API. Cleanup
 * закрывает оба канала при unmount, смене operation и terminal snapshot.
 */
export function usePlaceImportEvents(
  operation: PlaceImportOperationResponseDto | undefined,
): PlaceImportEventsState {
  const queryClient = useQueryClient()
  const [fallbackOperationId, setFallbackOperationId] = useState<string | null>(
    null,
  )
  const [pollingError, setPollingError] = useState<{
    message: string
    operationId: string
  } | null>(null)
  const operationId = operation?.id
  const isTerminal = operation
    ? isTerminalPlaceImportStatus(operation.status)
    : false
  const isEventSourceUnavailable = typeof EventSource === 'undefined'
  const isPollingFallback =
    Boolean(operationId) &&
    !isTerminal &&
    (isEventSourceUnavailable || fallbackOperationId === operationId)

  useEffect(() => {
    if (
      !operationId ||
      isTerminal ||
      isEventSourceUnavailable ||
      fallbackOperationId === operationId
    ) {
      return
    }

    let subscription: PlaceImportEventsSubscription | null = null
    const cachedOperation =
      queryClient.getQueryData<PlaceImportOperationResponseDto>(
        getAdminPlaceImportsGetQueryKey({ operationId }),
      )
    const enableFallback = () => {
      subscription?.close()
      setFallbackOperationId(operationId)
    }
    subscription = subscribeToPlaceImportEvents(
      operationId,
      cachedOperation?.version ?? 0,
      {
        onError: enableFallback,
        onUpdate: (data) => {
          try {
            const response = parsePlaceImportEventData(data)
            syncPlaceImportOperationCache(queryClient, response.operation)

            if (isTerminalPlaceImportStatus(response.operation.status)) {
              subscription?.close()
              if (response.operation.status === 'completed') {
                void invalidatePlaceImportResultQueries(queryClient)
              }
            }
          } catch {
            enableFallback()
          }
        },
      },
    )

    return () => subscription.close()
  }, [
    fallbackOperationId,
    isEventSourceUnavailable,
    isTerminal,
    operationId,
    queryClient,
  ])

  useEffect(() => {
    if (!operationId || !isPollingFallback) return

    let isDisposed = false
    const cachedOperation =
      queryClient.getQueryData<PlaceImportOperationResponseDto>(
        getAdminPlaceImportsGetQueryKey({ operationId }),
      )
    let lastVersion = cachedOperation?.version ?? 0
    let isRequestInFlight = false
    let activeRequestController: AbortController | null = null
    const poll = async () => {
      if (isRequestInFlight) return

      isRequestInFlight = true
      const requestController = new AbortController()
      activeRequestController = requestController
      try {
        const response = await adminPlaceImportsGetEvents(
          { operationId },
          { afterVersion: lastVersion },
          undefined,
          requestController.signal,
        )
        if (isDisposed) return

        setPollingError(null)
        lastVersion = Math.max(lastVersion, response.operation.version)
        syncPlaceImportOperationCache(queryClient, response.operation)
        if (response.operation.status === 'completed') {
          await invalidatePlaceImportResultQueries(queryClient)
        }
      } catch (error) {
        if (!isDisposed) {
          setPollingError({
            message: normalizeApiError(error).message,
            operationId,
          })
        }
      } finally {
        if (activeRequestController === requestController) {
          activeRequestController = null
        }
        isRequestInFlight = false
      }
    }

    void poll()
    const intervalId = window.setInterval(() => {
      void poll()
    }, PLACE_IMPORT_POLL_INTERVAL_MS)

    return () => {
      isDisposed = true
      window.clearInterval(intervalId)
      activeRequestController?.abort()
      activeRequestController = null
    }
  }, [isPollingFallback, operationId, queryClient])

  const pollingErrorMessage =
    isPollingFallback && pollingError?.operationId === operationId
      ? (pollingError?.message ?? null)
      : null

  return { isPollingFallback, pollingErrorMessage }
}
