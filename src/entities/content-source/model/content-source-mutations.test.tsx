import type {
  ContentSourceResponseDto,
  ImportRunResponseDto,
} from '@/shared/api'
import {
  adminContentSourcesCreate,
  adminContentSourcesUpdate,
  adminContentSourcesUpdateStatus,
  adminTelegramImportsEnqueue,
  getAdminContentSourcesListQueryKey,
  getAdminImportRunsListQueryKey,
  getAdminMaterialsListQueryKey,
} from '@/shared/api'
import { ApiClientError } from '@/shared/api/client/api-error'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCreateContentSourceMutation,
  useImportTelegramSourceMutation,
  useUpdateContentSourceMutation,
  useUpdateContentSourceStatusMutation,
} from './content-source-mutations'

vi.mock('@/shared/api', () => ({
  adminContentSourcesCreate: vi.fn(),
  getAdminMaterialsListQueryKey: vi.fn(() => ['/v1/admin/materials']),
  getAdminContentSourcesListQueryKey: vi.fn(() => [
    '/v1/admin/content-sources',
  ]),
  getAdminImportRunsListQueryKey: vi.fn(() => ['/v1/admin/import-runs']),
  adminTelegramImportsEnqueue: vi.fn(),
  adminContentSourcesUpdate: vi.fn(),
  adminContentSourcesUpdateStatus: vi.fn(),
}))

const mockedCreateContentSource = vi.mocked(adminContentSourcesCreate)
const mockedImportTelegramChannel = vi.mocked(adminTelegramImportsEnqueue)
const mockedUpdateContentSource = vi.mocked(adminContentSourcesUpdate)
const mockedUpdateContentSourceStatus = vi.mocked(
  adminContentSourcesUpdateStatus,
)

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const contentSource: ContentSourceResponseDto = {
  channelId: '-100123',
  createdAt: '2026-06-15T10:00:00.000Z',
  displayName: 'Amazing EKB Telegram',
  externalId: 'amazing_ekb',
  handle: 'amazing_ekb',
  id: 'source-1',
  lastCursor: null,
  lastImportedAt: null,
  platform: 'telegram',
  status: 'active',
  updatedAt: '2026-06-15T10:00:00.000Z',
  url: 'https://t.me/amazing_ekb',
}

const importRun: ImportRunResponseDto = {
  createdAt: '2026-06-16T08:00:00.000Z',
  createdCount: 2,
  errorMessage: null,
  finishedAt: '2026-06-16T08:01:00.000Z',
  foundCount: 3,
  id: 'run-1',
  skippedDuplicateCount: 1,
  sourceId: 'source-1',
  startedAt: '2026-06-16T08:00:00.000Z',
  status: 'completed',
  updatedAt: '2026-06-16T08:01:00.000Z',
  updatedCount: 0,
}

describe('content source mutations', () => {
  beforeEach(() => {
    mockedCreateContentSource.mockReset()
    mockedImportTelegramChannel.mockReset()
    mockedUpdateContentSource.mockReset()
    mockedUpdateContentSourceStatus.mockReset()
    vi.mocked(getAdminMaterialsListQueryKey).mockImplementation(() => [
      '/v1/admin/materials',
    ])
    vi.mocked(getAdminContentSourcesListQueryKey).mockImplementation(() => [
      '/v1/admin/content-sources',
    ])
    vi.mocked(getAdminImportRunsListQueryKey).mockImplementation(() => [
      '/v1/admin/import-runs',
    ])
  })

  it('creates content source and invalidates all source lists', async () => {
    const queryClient = new QueryClient()
    const sourceQueryKey = ['/v1/admin/content-sources']
    const filteredSourceQueryKey = [
      '/v1/admin/content-sources',
      { platform: 'telegram' },
    ]
    const onSuccess = vi.fn()
    queryClient.setQueryData(sourceQueryKey, { items: [] })
    queryClient.setQueryData(filteredSourceQueryKey, { items: [] })
    mockedCreateContentSource.mockResolvedValue(contentSource)

    const { result } = renderHook(
      () => useCreateContentSourceMutation({ onSuccess }),
      { wrapper: createWrapper(queryClient) },
    )

    await result.current.mutateAsync({
      displayName: 'Amazing EKB Telegram',
      platform: 'telegram',
      url: 'https://t.me/amazing_ekb',
    })

    expect(mockedCreateContentSource).toHaveBeenCalledWith({
      displayName: 'Amazing EKB Telegram',
      platform: 'telegram',
      url: 'https://t.me/amazing_ekb',
    })
    expect(
      queryClient.getQueryCache().find({ queryKey: sourceQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: filteredSourceQueryKey })
        ?.state.isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(contentSource)
  })

  it('updates content source and passes errors to callback', async () => {
    const queryClient = new QueryClient()
    const apiError = new ApiClientError({
      kind: 'server',
      message: 'Source unavailable',
      status: 500,
    })
    const onError = vi.fn()
    mockedUpdateContentSource.mockRejectedValue(apiError)

    const { result } = renderHook(
      () => useUpdateContentSourceMutation({ onError }),
      { wrapper: createWrapper(queryClient) },
    )

    await expect(
      result.current.mutateAsync({
        data: { displayName: 'Updated' },
        sourceId: 'source-1',
      }),
    ).rejects.toBe(apiError)

    expect(mockedUpdateContentSource).toHaveBeenCalledWith(
      { sourceId: 'source-1' },
      { displayName: 'Updated' },
    )
    expect(onError).toHaveBeenCalledWith(apiError)
  })

  it('updates content source and invalidates sources plus material library', async () => {
    const queryClient = new QueryClient()
    const sourceQueryKey = ['/v1/admin/content-sources']
    const materialQueryKey = ['/v1/admin/materials']
    const onSuccess = vi.fn()
    queryClient.setQueryData(sourceQueryKey, { items: [contentSource] })
    queryClient.setQueryData(materialQueryKey, { items: [] })
    mockedUpdateContentSource.mockResolvedValue({
      ...contentSource,
      displayName: 'Updated',
    })

    const { result } = renderHook(
      () => useUpdateContentSourceMutation({ onSuccess }),
      { wrapper: createWrapper(queryClient) },
    )

    await result.current.mutateAsync({
      data: { displayName: 'Updated' },
      sourceId: 'source-1',
    })

    expect(
      queryClient.getQueryCache().find({ queryKey: sourceQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: materialQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith({
      ...contentSource,
      displayName: 'Updated',
    })
  })

  it('updates content source status and invalidates source lists', async () => {
    const queryClient = new QueryClient()
    const sourceQueryKey = ['/v1/admin/content-sources']
    const onSuccess = vi.fn()
    queryClient.setQueryData(sourceQueryKey, { items: [contentSource] })
    mockedUpdateContentSourceStatus.mockResolvedValue({
      ...contentSource,
      status: 'disabled',
    })

    const { result } = renderHook(
      () => useUpdateContentSourceStatusMutation({ onSuccess }),
      { wrapper: createWrapper(queryClient) },
    )

    await result.current.mutateAsync({
      sourceId: 'source-1',
      status: 'disabled',
    })

    expect(mockedUpdateContentSourceStatus).toHaveBeenCalledWith(
      { sourceId: 'source-1' },
      { status: 'disabled' },
    )
    expect(
      queryClient.getQueryCache().find({ queryKey: sourceQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith({
      ...contentSource,
      status: 'disabled',
    })
  })

  it('imports Telegram source and invalidates sources, import runs, and material library', async () => {
    const queryClient = new QueryClient()
    const sourceQueryKey = ['/v1/admin/content-sources']
    const runQueryKey = ['/v1/admin/import-runs']
    const materialQueryKey = ['/v1/admin/materials']
    const onSuccess = vi.fn()
    queryClient.setQueryData(sourceQueryKey, { items: [contentSource] })
    queryClient.setQueryData(runQueryKey, { items: [] })
    queryClient.setQueryData(materialQueryKey, { items: [] })
    mockedImportTelegramChannel.mockResolvedValue(importRun)

    const { result } = renderHook(
      () => useImportTelegramSourceMutation({ onSuccess }),
      { wrapper: createWrapper(queryClient) },
    )

    await result.current.mutateAsync({ sourceId: 'source-1' })

    expect(mockedImportTelegramChannel).toHaveBeenCalledWith({
      sourceId: 'source-1',
    })
    expect(
      queryClient.getQueryCache().find({ queryKey: sourceQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: runQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(queryClient.getQueryData(runQueryKey)).toEqual({
      items: [importRun],
    })
    expect(
      queryClient.getQueryCache().find({ queryKey: materialQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(importRun)
  })

  it('invalidates import runs and passes 409 conflicts to callback', async () => {
    const queryClient = new QueryClient()
    const runQueryKey = ['/v1/admin/import-runs']
    const onError = vi.fn()
    const apiError = new ApiClientError({
      kind: 'conflict',
      message: 'Import already running',
      status: 409,
    })

    queryClient.setQueryData(runQueryKey, { items: [] })
    mockedImportTelegramChannel.mockRejectedValue(apiError)

    const { result } = renderHook(
      () => useImportTelegramSourceMutation({ onError }),
      { wrapper: createWrapper(queryClient) },
    )

    await expect(
      result.current.mutateAsync({ sourceId: 'source-1' }),
    ).rejects.toBe(apiError)

    expect(
      queryClient.getQueryCache().find({ queryKey: runQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(onError).toHaveBeenCalledWith(apiError)
  })
})
