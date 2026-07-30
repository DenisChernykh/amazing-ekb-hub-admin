import type { PlaceCategoryListResponseDto } from '@/shared/api'
import {
  adminCategoriesList,
  getAdminCategoriesListQueryKey,
} from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlaceCategoriesQuery } from './category-hooks'

vi.mock('@/shared/api', () => ({
  getAdminCategoriesListQueryKey: vi.fn(() => ['/v1/admin/categories']),
  adminCategoriesList: vi.fn(),
}))

const mockedListAdminPlaceCategories = vi.mocked(adminCategoriesList)

const categoryListResponse: PlaceCategoryListResponseDto = {
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
    vi.mocked(getAdminCategoriesListQueryKey).mockClear()
  })

  it('loads admin categories through generated fetcher and query key', async () => {
    const queryClient = createQueryClient()
    mockedListAdminPlaceCategories.mockResolvedValue(categoryListResponse)

    const { result } = renderHook(() => usePlaceCategoriesQuery(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getAdminCategoriesListQueryKey).toHaveBeenCalledWith()
    expect(mockedListAdminPlaceCategories).toHaveBeenCalledWith(
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(categoryListResponse)
  })
})
