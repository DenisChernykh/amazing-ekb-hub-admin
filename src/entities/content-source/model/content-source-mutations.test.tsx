import { ApiClientError } from '@/shared/api/client/api-error'
import {
  createContentSource,
  getListAdminMaterialLibraryQueryKey,
  getListContentSourcesQueryKey,
  getListImportRunsQueryKey,
  importTelegramChannel,
  updateContentSource,
  updateContentSourceStatus,
} from '@/shared/api/generated/admin/admin'
import type { ContentSource, ImportRun } from '@/shared/api/generated/model'
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

vi.mock('@/shared/api/generated/admin/admin', () => ({
  createContentSource: vi.fn(),
  getListAdminMaterialLibraryQueryKey: vi.fn(() => ['/admin/materials']),
  getListContentSourcesQueryKey: vi.fn(() => ['/admin/content-sources']),
  getListImportRunsQueryKey: vi.fn(() => ['/admin/import-runs']),
  importTelegramChannel: vi.fn(),
  updateContentSource: vi.fn(),
  updateContentSourceStatus: vi.fn(),
}))

const mockedCreateContentSource = vi.mocked(createContentSource)
const mockedImportTelegramChannel = vi.mocked(importTelegramChannel)
const mockedUpdateContentSource = vi.mocked(updateContentSource)
const mockedUpdateContentSourceStatus = vi.mocked(updateContentSourceStatus)

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const contentSource: ContentSource = {
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

const importRun: ImportRun = {
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
    vi.mocked(getListAdminMaterialLibraryQueryKey).mockImplementation(() => [
      '/admin/materials',
    ])
    vi.mocked(getListContentSourcesQueryKey).mockImplementation(() => [
      '/admin/content-sources',
    ])
    vi.mocked(getListImportRunsQueryKey).mockImplementation(() => [
      '/admin/import-runs',
    ])
  })

  it('creates content source and invalidates all source lists', async () => {
    const queryClient = new QueryClient()
    const sourceQueryKey = ['/admin/content-sources']
    const filteredSourceQueryKey = [
      '/admin/content-sources',
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
    const sourceQueryKey = ['/admin/content-sources']
    const materialQueryKey = ['/admin/materials']
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
    const sourceQueryKey = ['/admin/content-sources']
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
    const sourceQueryKey = ['/admin/content-sources']
    const runQueryKey = ['/admin/import-runs']
    const materialQueryKey = ['/admin/materials']
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
    expect(
      queryClient.getQueryCache().find({ queryKey: materialQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(importRun)
  })
})
