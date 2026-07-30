import type {
  AdminPlaceListResponseDto,
  PlaceCategoryResponseDto,
  PlaceDetailResponseDto,
} from '@/shared/api'
import {
  adminPlacesGet,
  adminPlacesList,
  getAdminPlacesGetQueryKey,
  getAdminPlacesListQueryKey,
} from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminPlaceDetailQuery, usePlacesListQuery } from './place-hooks'

vi.mock('@/shared/api', () => ({
  adminPlacesGet: vi.fn(),
  getAdminPlacesGetQueryKey: vi.fn(({ placeId }) => [
    `/v1/admin/places/${placeId}`,
  ]),
  getAdminPlacesListQueryKey: vi.fn((params) => [
    '/v1/admin/places',
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
  adminPlacesList: vi.fn(),
}))

const mockedListAdminPlaces = vi.mocked(adminPlacesList)
const mockedGetAdminPlaceDetail = vi.mocked(adminPlacesGet)

const placeListResponse: AdminPlaceListResponseDto = {
  items: [],
  page: 1,
  pageSize: 10,
  total: 0,
}

const spaCategory = {
  coverImageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  status: 'active',
  updatedAt: '2026-01-01T00:00:00.000Z',
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
} satisfies PlaceCategoryResponseDto

const placeDetail: PlaceDetailResponseDto = {
  mapsUrl: null,
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
    vi.mocked(getAdminPlacesListQueryKey).mockClear()
    vi.mocked(getAdminPlacesGetQueryKey).mockClear()
  })

  it('loads admin places through generated fetcher and query key', async () => {
    const queryClient = createQueryClient()
    const params = { page: 1, pageSize: 10, status: 'hidden' as const }
    mockedListAdminPlaces.mockResolvedValue(placeListResponse)

    const { result } = renderHook(() => usePlacesListQuery(params), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getAdminPlacesListQueryKey).toHaveBeenCalledWith(params)
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

    expect(getAdminPlacesGetQueryKey).toHaveBeenCalledWith({
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
