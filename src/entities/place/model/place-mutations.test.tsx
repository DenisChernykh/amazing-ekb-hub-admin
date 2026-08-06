import type {
  PlaceCategoryResponseDto,
  PlaceDetailResponseDto,
  PlaceSummaryResponseDto,
} from '@/shared/api'
import {
  adminPlaceCollectionsReplace,
  adminPlacesClearPinnedMaterial,
  adminPlacesCreate,
  adminPlacesSetPinnedMaterial,
  adminPlacesUpdate,
  adminPlacesUpdateStatus,
  adminPlacesUploadPhoto,
  getAdminCategoriesListQueryKey,
  getAdminPlacesGetQueryKey,
  getAdminPlacesListQueryKey,
} from '@/shared/api'
import { createApiProblemError } from '@/test/api-problem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useClearPinnedMaterialMutation,
  useCreatePlaceMutation,
  useReplacePlaceCollectionsMutation,
  useSetPinnedMaterialMutation,
  useUpdatePlaceMutation,
  useUpdatePlaceStatusMutation,
  useUploadPlaceCoverPhotoMutation,
} from './place-mutations'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  adminPlacesClearPinnedMaterial: vi.fn(),
  adminPlaceCollectionsReplace: vi.fn(),
  adminPlacesCreate: vi.fn(),
  getAdminPlacesGetQueryKey: vi.fn(({ placeId }) => [
    `/v1/admin/places/${placeId}`,
  ]),
  getAdminCategoriesListQueryKey: vi.fn(() => ['/v1/admin/categories']),
  getAdminPlacesListQueryKey: vi.fn(() => ['/v1/admin/places']),
  adminPlacesSetPinnedMaterial: vi.fn(),
  adminPlacesUpdate: vi.fn(),
  adminPlacesUpdateStatus: vi.fn(),
  adminPlacesUploadPhoto: vi.fn(),
  useClearPinnedMaterial: vi.fn(),
  useCreatePlace: vi.fn(),
  useSetPinnedMaterial: vi.fn(),
  useUpdatePlace: vi.fn(),
  useUpdatePlaceStatus: vi.fn(),
  useUploadPlaceCoverPhoto: vi.fn(),
}))

const mockedClearPinnedMaterial = vi.mocked(adminPlacesClearPinnedMaterial)
const mockedReplacePlaceCollections = vi.mocked(adminPlaceCollectionsReplace)
const mockedCreatePlace = vi.mocked(adminPlacesCreate)
const mockedSetPinnedMaterial = vi.mocked(adminPlacesSetPinnedMaterial)
const mockedUpdatePlace = vi.mocked(adminPlacesUpdate)
const mockedUpdatePlaceStatus = vi.mocked(adminPlacesUpdateStatus)
const mockedUploadPlaceCoverPhoto = vi.mocked(adminPlacesUploadPhoto)

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
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

const cafeCategory = {
  coverImageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  status: 'active',
  updatedAt: '2026-01-01T00:00:00.000Z',
  id: 'category_cafe',
  slug: 'cafe',
  title: 'Кафе',
} satisfies PlaceCategoryResponseDto

const placeSummary: PlaceSummaryResponseDto = {
  category: spaCategory,
  coverImageUrl: null,
  id: 'place-1',
  slug: 'new-spa',
  status: 'active',
  summary: 'Новый SPA в центре',
  tags: ['spa'],
  title: 'Тихий SPA',
}

const placeDetail: PlaceDetailResponseDto = {
  mapsUrl: null,
  category: spaCategory,
  counters: {
    dzen: 0,
    instagram: 0,
    telegram: 1,
  },
  coverImageUrl: null,
  id: 'place-1',
  pinnedMaterial: null,
  slug: 'hidden-spa',
  status: 'hidden',
  summary: 'SPA без закрепления',
  tags: ['spa'],
  title: 'Unpinned SPA',
}

describe('place mutations', () => {
  beforeEach(() => {
    mockedClearPinnedMaterial.mockReset()
    mockedReplacePlaceCollections.mockReset()
    mockedCreatePlace.mockReset()
    mockedSetPinnedMaterial.mockReset()
    mockedUpdatePlace.mockReset()
    mockedUpdatePlaceStatus.mockReset()
    mockedUploadPlaceCoverPhoto.mockReset()
    vi.mocked(getAdminPlacesGetQueryKey).mockImplementation(({ placeId }) => [
      `/v1/admin/places/${placeId}`,
    ])
    vi.mocked(getAdminPlacesListQueryKey).mockReturnValue(['/v1/admin/places'])
    vi.mocked(getAdminCategoriesListQueryKey).mockReturnValue([
      '/v1/admin/categories',
    ])
  })

  it('creates place through generated fetcher and invalidates places list queries', async () => {
    const queryClient = new QueryClient()
    const queryKey = ['/v1/admin/places', { page: 1, pageSize: 10 }]
    const onSuccess = vi.fn()
    queryClient.setQueryData(queryKey, { items: [], page: 1, pageSize: 10 })
    mockedCreatePlace.mockResolvedValue(placeSummary)

    const { result } = renderHook(() => useCreatePlaceMutation({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({
      data: {
        categoryId: 'category_spa',
        summary: 'Новый SPA',
        tags: ['spa'],
        title: 'SPA',
      },
    })

    expect(mockedCreatePlace).toHaveBeenCalledWith({
      categoryId: 'category_spa',
      summary: 'Новый SPA',
      tags: ['spa'],
      title: 'SPA',
    })
    expect(
      queryClient.getQueryCache().find({ queryKey })?.state.isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(placeSummary)
  })

  it('saves the full collection set and invalidates affected collection details', async () => {
    const queryClient = new QueryClient()
    const placeListKey = ['/v1/admin/places']
    queryClient.setQueryData(placeListKey, { items: [] })
    mockedReplacePlaceCollections.mockResolvedValue(undefined)

    const { result } = renderHook(() => useReplacePlaceCollectionsMutation(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({
      data: { collectionIds: ['collection-2'] },
      pathParams: { placeId: 'place-1' },
      previousCollectionIds: ['collection-1'],
    })

    expect(mockedReplacePlaceCollections).toHaveBeenCalledWith(
      { placeId: 'place-1' },
      { collectionIds: ['collection-2'] },
    )
    expect(
      queryClient.getQueryCache().find({ queryKey: placeListKey })?.state
        .isInvalidated,
    ).toBe(true)
  })

  it('passes create place errors to callback', async () => {
    const queryClient = new QueryClient()
    const apiError = createApiProblemError('INTERNAL_ERROR', 500)
    const onError = vi.fn()
    mockedCreatePlace.mockRejectedValue(apiError)

    const { result } = renderHook(() => useCreatePlaceMutation({ onError }), {
      wrapper: createWrapper(queryClient),
    })

    await expect(
      result.current.mutateAsync({
        data: {
          categoryId: 'category_spa',
          title: 'SPA',
        },
      }),
    ).rejects.toBe(apiError)
    expect(onError).toHaveBeenCalledWith(apiError)
  })

  it('updates place status and invalidates places list plus detail queries', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/v1/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/v1/admin/places/place-2']
    const categoryQueryKey = ['/v1/admin/categories']
    const updatedPlace: PlaceSummaryResponseDto = {
      ...placeSummary,
      id: 'place-2',
      status: 'active',
      title: 'Скрытый SPA',
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
    queryClient.setQueryData(categoryQueryKey, { items: [] })
    mockedUpdatePlaceStatus.mockResolvedValue(updatedPlace)

    const { result } = renderHook(
      () => useUpdatePlaceStatusMutation({ onSuccess }),
      { wrapper: createWrapper(queryClient) },
    )

    await result.current.mutateAsync({
      data: { status: 'active' },
      pathParams: { placeId: 'place-2' },
    })

    expect(mockedUpdatePlaceStatus).toHaveBeenCalledWith(
      { placeId: 'place-2' },
      { status: 'active' },
    )
    expect(
      queryClient.getQueryCache().find({ queryKey: listQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: detailQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: categoryQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(updatedPlace)
  })

  it('updates place fields and invalidates places list plus detail queries', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/v1/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/v1/admin/places/place-3']
    const updatedPlace: PlaceSummaryResponseDto = {
      ...placeSummary,
      category: cafeCategory,
      id: 'place-3',
      title: 'Новая кофейня',
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
    mockedUpdatePlace.mockResolvedValue(updatedPlace)

    const { result } = renderHook(() => useUpdatePlaceMutation({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({
      data: { title: 'Новая кофейня' },
      pathParams: { placeId: 'place-3' },
    })

    expect(mockedUpdatePlace).toHaveBeenCalledWith(
      { placeId: 'place-3' },
      { title: 'Новая кофейня' },
    )
    expect(
      queryClient.getQueryCache().find({ queryKey: listQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: detailQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(updatedPlace)
  })

  it('uploads cover photo and invalidates places list plus detail queries', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/v1/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/v1/admin/places/place-4']
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    const updatedPlace: PlaceSummaryResponseDto = {
      ...placeSummary,
      coverImageUrl: '/places/place-4/photo',
      id: 'place-4',
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
    mockedUploadPlaceCoverPhoto.mockResolvedValue(updatedPlace)

    const { result } = renderHook(
      () => useUploadPlaceCoverPhotoMutation({ onSuccess }),
      { wrapper: createWrapper(queryClient) },
    )

    await result.current.mutateAsync({
      data: { photo: file },
      pathParams: { placeId: 'place-4' },
    })

    expect(mockedUploadPlaceCoverPhoto).toHaveBeenCalledWith(
      { placeId: 'place-4' },
      { photo: file },
    )
    expect(
      queryClient.getQueryCache().find({ queryKey: listQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: detailQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(updatedPlace)
  })

  it('sets pinned material and invalidates only admin detail query', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/v1/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/v1/admin/places/place-5']
    const updatedPlace: PlaceDetailResponseDto = {
      ...placeDetail,
      id: 'place-5',
      pinnedMaterial: {
        durationSec: null,
        id: 'material-1',
        placeId: 'place-5',
        platform: 'telegram',
        publishedAt: '2026-03-20T10:30:00+05:00',
        redirectUrl: '/v1/materials/material-1/go',
        title: 'Стартовый обзор',
        type: 'post',
      },
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
    mockedSetPinnedMaterial.mockResolvedValue(updatedPlace)

    const { result } = renderHook(
      () => useSetPinnedMaterialMutation({ onSuccess }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await result.current.mutateAsync({
      data: { materialId: 'material-1' },
      pathParams: { placeId: 'place-5' },
    })

    expect(mockedSetPinnedMaterial).toHaveBeenCalledWith(
      { placeId: 'place-5' },
      { materialId: 'material-1' },
    )
    expect(
      queryClient.getQueryCache().find({ queryKey: detailQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: listQueryKey })?.state
        .isInvalidated,
    ).toBe(false)
    expect(onSuccess).toHaveBeenCalledWith(updatedPlace)
  })

  it('clears pinned material and invalidates only admin detail query', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/v1/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/v1/admin/places/place-6']
    const updatedPlace: PlaceDetailResponseDto = {
      ...placeDetail,
      id: 'place-6',
      pinnedMaterial: null,
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
    mockedClearPinnedMaterial.mockResolvedValue(updatedPlace)

    const { result } = renderHook(
      () => useClearPinnedMaterialMutation({ onSuccess }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await result.current.mutateAsync({
      pathParams: { placeId: 'place-6' },
    })

    expect(mockedClearPinnedMaterial).toHaveBeenCalledWith({
      placeId: 'place-6',
    })
    expect(
      queryClient.getQueryCache().find({ queryKey: detailQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: listQueryKey })?.state
        .isInvalidated,
    ).toBe(false)
    expect(onSuccess).toHaveBeenCalledWith(updatedPlace)
  })
})
