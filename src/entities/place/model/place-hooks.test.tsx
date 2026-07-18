import {
  getAdminPlaceDetail,
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlacesQueryKey,
  listAdminPlaces,
} from '@/shared/api/generated/admin/admin'
import type {
  PlaceDetail,
  PlaceListResponse,
} from '@/shared/api/generated/model'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminPlaceDetailQuery, usePlacesListQuery } from './place-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getAdminPlaceDetail: vi.fn(),
  getGetAdminPlaceDetailQueryKey: vi.fn(({ placeId }) => [
    `/admin/places/${placeId}`,
  ]),
  getListAdminPlacesQueryKey: vi.fn((params) => [
    '/admin/places',
    ...(params ? [params] : []),
  ]),
  useGetAdminPlaceDetail: vi.fn(() => ({
    data: undefined,
    isPending: true,
  })),
  useListAdminPlaces: vi.fn(() => ({
    data: undefined,
    isPending: true,
  })),
  listAdminPlaces: vi.fn(),
}))

const mockedListAdminPlaces = vi.mocked(listAdminPlaces)
const mockedGetAdminPlaceDetail = vi.mocked(getAdminPlaceDetail)

const placeListResponse: PlaceListResponse = {
  items: [],
  page: 1,
  pageSize: 10,
  total: 0,
}

const spaCategory = {
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
}

const placeDetail: PlaceDetail = {
  category: spaCategory,
  counters: {
    dzen: 0,
    instagram: 0,
    telegram: 0,
  },
  coverImageUrl: null,
  id: 'place-1',
  pinnedMaterial: null,
  slug: 'spa',
  status: 'active',
  summary: '',
  tags: [],
  title: 'Место',
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

describe('place hooks', () => {
  beforeEach(() => {
    mockedListAdminPlaces.mockReset()
    mockedGetAdminPlaceDetail.mockReset()
    vi.mocked(getListAdminPlacesQueryKey).mockClear()
    vi.mocked(getGetAdminPlaceDetailQueryKey).mockClear()
  })

  it('loads admin places through generated fetcher and query key', async () => {
    const queryClient = createQueryClient()
    const params = { page: 1, pageSize: 10, status: 'hidden' as const }
    mockedListAdminPlaces.mockResolvedValue(placeListResponse)

    const { result } = renderHook(() => usePlacesListQuery(params), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getListAdminPlacesQueryKey).toHaveBeenCalledWith(params)
    expect(mockedListAdminPlaces).toHaveBeenCalledWith(
      params,
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(placeListResponse)
  })

  it('loads admin place detail through generated fetcher and query key', async () => {
    const queryClient = createQueryClient()
    mockedGetAdminPlaceDetail.mockResolvedValue(placeDetail)

    const { result } = renderHook(() => useAdminPlaceDetailQuery('place-1'), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getGetAdminPlaceDetailQueryKey).toHaveBeenCalledWith({
      placeId: 'place-1',
    })
    expect(mockedGetAdminPlaceDetail).toHaveBeenCalledWith(
      { placeId: 'place-1' },
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(placeDetail)
  })
})
