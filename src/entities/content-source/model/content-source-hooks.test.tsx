import {
  getListContentSourcesQueryKey,
  listContentSources,
} from '@/shared/api/generated/admin/admin'
import type { ContentSourceListResponse } from '@/shared/api/generated/operation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useContentSourcesQuery } from './content-source-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getListContentSourcesQueryKey: vi.fn((params) => [
    '/admin/content-sources',
    ...(params ? [params] : []),
  ]),
  listContentSources: vi.fn(),
  useListContentSources: vi.fn(() => ({
    data: undefined,
    isPending: true,
  })),
}))

const mockedListContentSources = vi.mocked(listContentSources)

const contentSourceListResponse: ContentSourceListResponse = {
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

describe('content source hooks', () => {
  beforeEach(() => {
    mockedListContentSources.mockReset()
    vi.mocked(getListContentSourcesQueryKey).mockClear()
  })

  it('loads content sources through generated fetcher and query key', async () => {
    const queryClient = createQueryClient()
    const params = {
      platform: 'telegram' as const,
      status: 'active' as const,
    }
    mockedListContentSources.mockResolvedValue(contentSourceListResponse)

    const { result } = renderHook(() => useContentSourcesQuery(params), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getListContentSourcesQueryKey).toHaveBeenCalledWith(params)
    expect(mockedListContentSources).toHaveBeenCalledWith(
      params,
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(contentSourceListResponse)
  })

  it('does not load content sources while disabled', () => {
    const queryClient = createQueryClient()

    renderHook(() => useContentSourcesQuery(undefined, { enabled: false }), {
      wrapper: createWrapper(queryClient),
    })

    expect(mockedListContentSources).not.toHaveBeenCalled()
  })
})
