import {
  getListAdminMaterialLibraryQueryKey,
  getListContentSourcesQueryKey,
  getListImportRunsQueryKey,
} from '@/shared/api/generated/admin/admin'
import type { ImportRun, ImportRunStatus } from '@/shared/api/generated/model'
import type { ImportRunListResponse } from '@/shared/api/generated/operation'
import type { ListImportRunsParams } from '@/shared/api/generated/operation/listImportRunsParams'
import { isOneOf } from '@/shared/lib/type/is-one-of'
import { isRecord } from '@/shared/lib/type/is-record'
import type { QueryClient, QueryKey } from '@tanstack/react-query'

const importRunStatusValues = [
  'queued',
  'running',
  'completed',
  'failed',
] satisfies ImportRunStatus[]

const activeImportRunStatuses = new Set<ImportRunStatus>(['queued', 'running'])

const terminalImportRunStatuses = new Set<ImportRunStatus>([
  'completed',
  'failed',
])

const isImportRunStatus = (value: unknown): value is ImportRunStatus =>
  isOneOf(importRunStatusValues, value)

const getImportRunQueryParams = (
  queryKey: QueryKey,
): ListImportRunsParams | undefined => {
  const [, params] = queryKey

  if (!isRecord(params)) {
    return undefined
  }

  return {
    ...(typeof params.sourceId === 'string'
      ? { sourceId: params.sourceId }
      : {}),
    ...(isImportRunStatus(params.status) ? { status: params.status } : {}),
  }
}

const matchesImportRunParams = (
  importRun: ImportRun,
  params: ListImportRunsParams | undefined,
) => {
  if (params?.sourceId && params.sourceId !== importRun.sourceId) {
    return false
  }

  if (params?.status && params.status !== importRun.status) {
    return false
  }

  return true
}

const removeImportRunFromList = (
  response: ImportRunListResponse | undefined,
  importRunId: string,
) => {
  if (!response) {
    return response
  }

  return {
    items: response.items.filter((item) => item.id !== importRunId),
  }
}

const syncImportRunInList = (
  response: ImportRunListResponse | undefined,
  importRun: ImportRun,
  params: ListImportRunsParams | undefined,
) => {
  if (!matchesImportRunParams(importRun, params)) {
    return removeImportRunFromList(response, importRun.id)
  }

  return upsertImportRunInList(response, importRun)
}

/**
 * Проверяет, является ли статус import run активным для блокировки повторного запуска.
 */
export const isActiveImportRunStatus = (status: ImportRunStatus) =>
  activeImportRunStatuses.has(status)

/**
 * Проверяет, является ли статус import run терминальным для закрытия realtime-подписки.
 */
export const isTerminalImportRunStatus = (status: ImportRunStatus) =>
  terminalImportRunStatuses.has(status)

/**
 * Возвращает свежий активный import run для source из newest-first списка.
 *
 * @returns `null`, если для source нет `queued` или `running` run.
 */
export const getActiveImportRunForSource = (
  importRuns: ImportRun[],
  sourceId: string,
) =>
  importRuns.find(
    (importRun) =>
      importRun.sourceId === sourceId &&
      isActiveImportRunStatus(importRun.status),
  ) ?? null

/**
 * Добавляет новый import run в начало списка или заменяет существующий run с тем же id.
 */
export const upsertImportRunInList = (
  response: ImportRunListResponse | undefined,
  importRun: ImportRun,
): ImportRunListResponse => {
  if (!response) {
    return {
      items: [importRun],
    }
  }

  const existingIndex = response.items.findIndex(
    (item) => item.id === importRun.id,
  )

  if (existingIndex === -1) {
    return {
      items: [importRun, ...response.items],
    }
  }

  return {
    items: response.items.map((item) =>
      item.id === importRun.id ? importRun : item,
    ),
  }
}

/**
 * Синхронизирует все смонтированные кеши `GET /admin/import-runs` с новым снимком run.
 *
 * @remarks Учитывает `sourceId` и `status` фильтры, чтобы run исчезал из кешей,
 * которым больше не соответствует после transition.
 */
export const syncImportRunQueryCache = (
  queryClient: QueryClient,
  importRun: ImportRun,
) => {
  const rootQueryKey = getListImportRunsQueryKey()
  const seenQueryKeys = new Set<string>()
  const syncQueryKey = (queryKey: QueryKey) => {
    const cacheKey = JSON.stringify(queryKey)

    if (seenQueryKeys.has(cacheKey)) {
      return
    }

    seenQueryKeys.add(cacheKey)

    queryClient.setQueryData<ImportRunListResponse | undefined>(
      queryKey,
      (response) =>
        syncImportRunInList(
          response,
          importRun,
          getImportRunQueryParams(queryKey),
        ),
    )
  }

  syncQueryKey(rootQueryKey)

  queryClient
    .getQueryCache()
    .findAll({ queryKey: rootQueryKey })
    .forEach((query) => {
      syncQueryKey(query.queryKey)
    })
}

/**
 * Инвалидирует все варианты списка import runs.
 */
export const invalidateImportRunQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getListImportRunsQueryKey(),
  })
}

/**
 * Инвалидирует кеши, которые меняются в результате завершения import run.
 *
 * @remarks Import worker может обновить материалы и `lastImportedAt` уже после
 * `201 queued`, поэтому terminal SSE/fallback должен обновлять зависимые списки.
 */
export const invalidateImportRunDependencyQueries = (
  queryClient: QueryClient,
) => {
  return Promise.all([
    invalidateImportRunQueries(queryClient),
    queryClient.invalidateQueries({
      queryKey: getListContentSourcesQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getListAdminMaterialLibraryQueryKey(),
    }),
  ])
}

/**
 * Ищет import run среди смонтированных cache-вариантов `GET /admin/import-runs`.
 */
export const getImportRunFromQueryCache = (
  queryClient: QueryClient,
  runId: string,
) => {
  const rootQueryKey = getListImportRunsQueryKey()

  return (
    queryClient
      .getQueriesData<ImportRunListResponse | undefined>({
        queryKey: rootQueryKey,
      })
      .flatMap(([, response]) => response?.items ?? [])
      .find((importRun) => importRun.id === runId) ?? null
  )
}
