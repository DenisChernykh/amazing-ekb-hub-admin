import {
  getListImportRunsQueryKey,
  listImportRuns,
} from '@/shared/api/generated/admin/admin'
import type { ImportRunListResponse } from '@/shared/api/generated/operation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useImportRunsQuery } from './import-run-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getListImportRunsQueryKey: vi.fn((params) => [
    '/admin/import-runs',
    ...(params ? [params] : []),
  ]),
  listImportRuns: vi.fn(),
  useListImportRuns: vi.fn(() => ({
    data: undefined,
    isPending: true,
  })),
}))

const mockedListImportRuns = vi.mocked(listImportRuns)

const importRunListResponse: ImportRunListResponse = {
  items: [],
}

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

describe('import run hooks', () => {
  beforeEach(() => {
    mockedListImportRuns.mockReset()
    vi.mocked(getListImportRunsQueryKey).mockClear()
  })

  it('loads import runs through generated fetcher and query key', async () => {
    const queryClient = createQueryClient()
    const params = {
      sourceId: 'source-1',
      status: 'failed' as const,
    }
    mockedListImportRuns.mockResolvedValue(importRunListResponse)

    const { result } = renderHook(() => useImportRunsQuery(params), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getListImportRunsQueryKey).toHaveBeenCalledWith(params)
    expect(mockedListImportRuns).toHaveBeenCalledWith(
      params,
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(importRunListResponse)
  })
})
