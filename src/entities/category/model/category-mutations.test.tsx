import {
  createPlaceCategory,
  deletePlaceCategory,
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlaceCategoriesQueryKey,
  updatePlaceCategory,
} from '@/shared/api/generated/admin/admin'
import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from './category-mutations'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  createPlaceCategory: vi.fn(),
  deletePlaceCategory: vi.fn(),
  getGetAdminPlaceDetailQueryKey: vi.fn(({ placeId }) => [
    `/admin/places/${placeId}`,
  ]),
  getListAdminPlaceCategoriesQueryKey: vi.fn(() => ['/admin/categories']),
  getListAdminPlacesQueryKey: vi.fn(() => ['/admin/places']),
  updatePlaceCategory: vi.fn(),
}))

const mockedCreatePlaceCategory = vi.mocked(createPlaceCategory)
const mockedDeletePlaceCategory = vi.mocked(deletePlaceCategory)
const mockedUpdatePlaceCategory = vi.mocked(updatePlaceCategory)

const category: AdminPlaceCategory = {
  createdAt: '2026-07-03T10:00:00.000Z',
  coverImageUrl: null,
  id: 'category_spa',
  slug: 'spa',
  status: 'active',
  title: 'SPA',
  updatedAt: '2026-07-03T10:00:00.000Z',
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
      mutations: {
        retry: false,
      },
      queries: {
        retry: false,
      },
    },
  })

describe('category mutations', () => {
  beforeEach(() => {
    mockedCreatePlaceCategory.mockReset()
    mockedDeletePlaceCategory.mockReset()
    mockedUpdatePlaceCategory.mockReset()
    vi.mocked(getListAdminPlaceCategoriesQueryKey).mockClear()
  })

  it('creates category and invalidates category list', async () => {
    const queryClient = createQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    mockedCreatePlaceCategory.mockResolvedValue(category)

    const { result } = renderHook(() => useCreateCategoryMutation(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      title: 'SPA',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedCreatePlaceCategory).toHaveBeenCalledWith({
      title: 'SPA',
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/admin/categories'],
    })
  })

  it('updates category with path params and invalidates dependent caches', async () => {
    const queryClient = createQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    mockedUpdatePlaceCategory.mockResolvedValue(category)

    const { result } = renderHook(() => useUpdateCategoryMutation(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      categoryId: 'category_spa',
      data: {
        title: 'New SPA',
      },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedUpdatePlaceCategory).toHaveBeenCalledWith(
      { categoryId: 'category_spa' },
      {
        title: 'New SPA',
      },
    )
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/admin/categories'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/admin/places'],
    })

    const detailInvalidation = invalidateQueries.mock.calls.find(
      ([options]) => options !== undefined && 'predicate' in options,
    )?.[0]

    expect(
      detailInvalidation?.predicate?.({
        queryKey: getGetAdminPlaceDetailQueryKey({ placeId: 'place-1' }),
      } as never),
    ).toBe(true)
    expect(
      detailInvalidation?.predicate?.({
        queryKey: ['/admin/places'],
      } as never),
    ).toBe(false)
  })

  it('deletes category with path params and invalidates category list', async () => {
    const queryClient = createQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    mockedDeletePlaceCategory.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteCategoryMutation(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      categoryId: 'category_spa',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedDeletePlaceCategory).toHaveBeenCalledWith({
      categoryId: 'category_spa',
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/admin/categories'],
    })
  })
})
