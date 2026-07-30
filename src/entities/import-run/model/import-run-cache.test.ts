import type {
  ImportRunListResponseDto,
  ImportRunResponseDto,
} from '@/shared/api'
import {
  getAdminContentSourcesListQueryKey,
  getAdminImportRunsListQueryKey,
  getAdminMaterialsListQueryKey,
} from '@/shared/api'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import {
  getActiveImportRunForSource,
  getImportRunFromQueryCache,
  invalidateImportRunDependencyQueries,
  invalidateImportRunQueries,
  isActiveImportRunStatus,
  syncImportRunQueryCache,
  upsertImportRunInList,
} from './import-run-cache'

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

describe('import run cache helpers', () => {
  it('detects active import run statuses', () => {
    expect(isActiveImportRunStatus('queued')).toBe(true)
    expect(isActiveImportRunStatus('running')).toBe(true)
    expect(isActiveImportRunStatus('completed')).toBe(false)
    expect(isActiveImportRunStatus('failed')).toBe(false)
  })

  it('returns the latest active run for a source from newest-first lists', () => {
    const completedRun = makeRun({
      id: 'run-completed',
      status: 'completed',
    })
    const runningRun = makeRun({
      id: 'run-running',
      status: 'running',
    })
    const otherSourceRun = makeRun({
      id: 'run-other-source',
      sourceId: 'source-2',
      status: 'queued',
    })

    expect(
      getActiveImportRunForSource(
        [completedRun, otherSourceRun, runningRun],
        'source-1',
      ),
    ).toBe(runningRun)
    expect(getActiveImportRunForSource([completedRun], 'source-1')).toBeNull()
  })

  it('upserts import runs without duplicating existing rows', () => {
    const queuedRun = makeRun({ id: 'run-queued', status: 'queued' })
    const runningRun = makeRun({ id: 'run-running', status: 'running' })
    const response: ImportRunListResponseDto = {
      items: [queuedRun],
    }

    expect(upsertImportRunInList(response, runningRun)).toEqual({
      items: [runningRun, queuedRun],
    })
    expect(
      upsertImportRunInList(response, {
        ...queuedRun,
        status: 'running',
      }),
    ).toEqual({
      items: [
        {
          ...queuedRun,
          status: 'running',
        },
      ],
    })
  })

  it('syncs import run list caches while respecting source and status filters', async () => {
    const queryClient = new QueryClient()
    const queuedRun = makeRun({ id: 'run-1', status: 'queued' })
    const runningRun = makeRun({ id: 'run-1', status: 'running' })
    const otherRun = makeRun({
      id: 'run-2',
      sourceId: 'source-2',
      status: 'queued',
    })

    queryClient.setQueryData(getAdminImportRunsListQueryKey(), {
      items: [queuedRun],
    })
    queryClient.setQueryData(
      getAdminImportRunsListQueryKey({ sourceId: 'source-1' }),
      {
        items: [queuedRun],
      },
    )
    queryClient.setQueryData(
      getAdminImportRunsListQueryKey({ sourceId: 'source-2' }),
      {
        items: [otherRun],
      },
    )
    queryClient.setQueryData(
      getAdminImportRunsListQueryKey({ status: 'queued' }),
      {
        items: [queuedRun, otherRun],
      },
    )
    queryClient.setQueryData(
      getAdminImportRunsListQueryKey({ status: 'running' }),
      {
        items: [],
      },
    )

    syncImportRunQueryCache(queryClient, runningRun)

    expect(
      queryClient.getQueryData<ImportRunListResponseDto>(
        getAdminImportRunsListQueryKey(),
      )?.items,
    ).toEqual([runningRun])
    expect(
      queryClient.getQueryData<ImportRunListResponseDto>(
        getAdminImportRunsListQueryKey({ sourceId: 'source-1' }),
      )?.items,
    ).toEqual([runningRun])
    expect(
      queryClient.getQueryData<ImportRunListResponseDto>(
        getAdminImportRunsListQueryKey({ sourceId: 'source-2' }),
      )?.items,
    ).toEqual([otherRun])
    expect(
      queryClient.getQueryData<ImportRunListResponseDto>(
        getAdminImportRunsListQueryKey({ status: 'queued' }),
      )?.items,
    ).toEqual([otherRun])
    expect(
      queryClient.getQueryData<ImportRunListResponseDto>(
        getAdminImportRunsListQueryKey({ status: 'running' }),
      )?.items,
    ).toEqual([runningRun])

    await invalidateImportRunQueries(queryClient)

    expect(
      queryClient.getQueryCache().find({
        queryKey: getAdminImportRunsListQueryKey(),
      })?.state.isInvalidated,
    ).toBe(true)
  })

  it('finds an import run in mounted import-run query caches', () => {
    const queryClient = new QueryClient()
    const queuedRun = makeRun({ id: 'run-queued', status: 'queued' })

    queryClient.setQueryData(
      getAdminImportRunsListQueryKey({ sourceId: 'source-1' }),
      {
        items: [queuedRun],
      },
    )

    expect(getImportRunFromQueryCache(queryClient, 'run-queued')).toBe(
      queuedRun,
    )
    expect(getImportRunFromQueryCache(queryClient, 'run-missing')).toBeNull()
  })

  it('invalidates import completion dependency caches', async () => {
    const queryClient = new QueryClient()

    queryClient.setQueryData(getAdminImportRunsListQueryKey(), { items: [] })
    queryClient.setQueryData(getAdminContentSourcesListQueryKey(), {
      items: [],
    })
    queryClient.setQueryData(getAdminMaterialsListQueryKey(), {
      items: [],
    })

    await invalidateImportRunDependencyQueries(queryClient)

    expect(
      queryClient.getQueryCache().find({
        queryKey: getAdminImportRunsListQueryKey(),
      })?.state.isInvalidated,
    ).toBe(true)
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
})
