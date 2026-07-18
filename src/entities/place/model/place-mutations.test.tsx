import { ApiClientError } from '@/shared/api/client/api-error'
import {
  clearPinnedMaterial,
  createPlace,
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlacesQueryKey,
  setPinnedMaterial,
  updatePlace,
  updatePlaceStatus,
  uploadPlaceCoverPhoto,
} from '@/shared/api/generated/admin/admin'
import type { PlaceDetail, PlaceSummary } from '@/shared/api/generated/model'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useClearPinnedMaterialMutation,
  useCreatePlaceMutation,
  useSetPinnedMaterialMutation,
  useUpdatePlaceMutation,
  useUpdatePlaceStatusMutation,
  useUploadPlaceCoverPhotoMutation,
} from './place-mutations'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  clearPinnedMaterial: vi.fn(),
  createPlace: vi.fn(),
  getGetAdminPlaceDetailQueryKey: vi.fn(({ placeId }) => [
    `/admin/places/${placeId}`,
  ]),
  getListAdminPlacesQueryKey: vi.fn(() => ['/admin/places']),
  setPinnedMaterial: vi.fn(),
  updatePlace: vi.fn(),
  updatePlaceStatus: vi.fn(),
  uploadPlaceCoverPhoto: vi.fn(),
  useClearPinnedMaterial: vi.fn(),
  useCreatePlace: vi.fn(),
  useSetPinnedMaterial: vi.fn(),
  useUpdatePlace: vi.fn(),
  useUpdatePlaceStatus: vi.fn(),
  useUploadPlaceCoverPhoto: vi.fn(),
}))

const mockedClearPinnedMaterial = vi.mocked(clearPinnedMaterial)
const mockedCreatePlace = vi.mocked(createPlace)
const mockedSetPinnedMaterial = vi.mocked(setPinnedMaterial)
const mockedUpdatePlace = vi.mocked(updatePlace)
const mockedUpdatePlaceStatus = vi.mocked(updatePlaceStatus)
const mockedUploadPlaceCoverPhoto = vi.mocked(uploadPlaceCoverPhoto)

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const spaCategory = {
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
}

const cafeCategory = {
  id: 'category_cafe',
  slug: 'cafe',
  title: 'Кафе',
}

const placeSummary: PlaceSummary = {
  category: spaCategory,
  coverImageUrl: null,
  id: 'place-1',
  slug: 'new-spa',
  status: 'active',
  summary: 'Новый SPA в центре',
  tags: ['spa'],
  title: 'Тихий SPA',
}

const placeDetail: PlaceDetail = {
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
    mockedCreatePlace.mockReset()
    mockedSetPinnedMaterial.mockReset()
    mockedUpdatePlace.mockReset()
    mockedUpdatePlaceStatus.mockReset()
    mockedUploadPlaceCoverPhoto.mockReset()
    vi.mocked(getGetAdminPlaceDetailQueryKey).mockImplementation(
      ({ placeId }) => [`/admin/places/${placeId}`],
    )
    vi.mocked(getListAdminPlacesQueryKey).mockReturnValue(['/admin/places'])
  })

  it('creates place through generated fetcher and invalidates places list queries', async () => {
    const queryClient = new QueryClient()
    const queryKey = ['/admin/places', { page: 1, pageSize: 10 }]
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

  it('passes create place errors to callback', async () => {
    const queryClient = new QueryClient()
    const apiError = new ApiClientError({
      kind: 'server',
      message: 'Create unavailable',
      status: 500,
    })
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
    const listQueryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/admin/places/place-2']
    const updatedPlace: PlaceSummary = {
      ...placeSummary,
      id: 'place-2',
      status: 'active',
      title: 'Скрытый SPA',
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
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
    expect(onSuccess).toHaveBeenCalledWith(updatedPlace)
  })

  it('updates place fields and invalidates places list plus detail queries', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/admin/places/place-3']
    const updatedPlace: PlaceSummary = {
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
    const listQueryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/admin/places/place-4']
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    const updatedPlace: PlaceSummary = {
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
    const listQueryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/admin/places/place-5']
    const updatedPlace: PlaceDetail = {
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
    const listQueryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/admin/places/place-6']
    const updatedPlace: PlaceDetail = {
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
