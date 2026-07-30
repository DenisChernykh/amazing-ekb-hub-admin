import type { ImportRunListResponseDto } from '@/shared/api'
import {
  adminImportRunsList,
  getAdminImportRunsListQueryKey,
} from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useImportRunsQuery } from './import-run-hooks'

vi.mock('@/shared/api', () => ({
  getAdminImportRunsListQueryKey: vi.fn((params) => [
    '/v1/admin/import-runs',
    ...(params ? [params] : []),
  ]),
  adminImportRunsList: vi.fn(),
  useListImportRuns: vi.fn(() => ({
    data: undefined,
    isPending: true,
  })),
}))

const mockedListImportRuns = vi.mocked(adminImportRunsList)

const importRunListResponse: ImportRunListResponseDto = {
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
    vi.mocked(getAdminImportRunsListQueryKey).mockClear()
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

    expect(getAdminImportRunsListQueryKey).toHaveBeenCalledWith(params)
    expect(mockedListImportRuns).toHaveBeenCalledWith(
      params,
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(importRunListResponse)
  })
})
