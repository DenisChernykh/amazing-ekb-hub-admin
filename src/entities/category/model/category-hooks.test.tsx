import {
  getListAdminPlaceCategoriesQueryKey,
  listAdminPlaceCategories,
} from '@/shared/api/generated/admin/admin'
import type { AdminPlaceCategoryListResponse } from '@/shared/api/generated/operation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlaceCategoriesQuery } from './category-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getListAdminPlaceCategoriesQueryKey: vi.fn(() => ['/admin/categories']),
  listAdminPlaceCategories: vi.fn(),
}))

const mockedListAdminPlaceCategories = vi.mocked(listAdminPlaceCategories)

const categoryListResponse: AdminPlaceCategoryListResponse = {
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

describe('category hooks', () => {
  beforeEach(() => {
    mockedListAdminPlaceCategories.mockReset()
    vi.mocked(getListAdminPlaceCategoriesQueryKey).mockClear()
  })

  it('loads admin categories through generated fetcher and query key', async () => {
    const queryClient = createQueryClient()
    mockedListAdminPlaceCategories.mockResolvedValue(categoryListResponse)

    const { result } = renderHook(() => usePlaceCategoriesQuery(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getListAdminPlaceCategoriesQueryKey).toHaveBeenCalledWith()
    expect(mockedListAdminPlaceCategories).toHaveBeenCalledWith(
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(categoryListResponse)
  })
})
