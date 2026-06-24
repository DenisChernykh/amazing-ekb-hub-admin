import {
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlacesQueryKey,
  useClearPinnedMaterial,
  useCreatePlace,
  useSetPinnedMaterial,
  useUpdatePlace,
  useUpdatePlaceStatus,
  useUploadPlaceCoverPhoto,
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
  getGetAdminPlaceDetailQueryKey: vi.fn(({ placeId }) => [
    `/admin/places/${placeId}`,
  ]),
  getListAdminPlacesQueryKey: vi.fn(() => ['/admin/places']),
  useClearPinnedMaterial: vi.fn(),
  useCreatePlace: vi.fn(),
  useUploadPlaceCoverPhoto: vi.fn(),
  useSetPinnedMaterial: vi.fn(),
  useUpdatePlace: vi.fn(),
  useUpdatePlaceStatus: vi.fn(),
}))

const mockedUseClearPinnedMaterial = vi.mocked(useClearPinnedMaterial)
const mockedUseCreatePlace = vi.mocked(useCreatePlace)
const mockedUseSetPinnedMaterial = vi.mocked(useSetPinnedMaterial)
const mockedUseUploadPlaceCoverPhoto = vi.mocked(useUploadPlaceCoverPhoto)
const mockedUseUpdatePlace = vi.mocked(useUpdatePlace)
const mockedUseUpdatePlaceStatus = vi.mocked(useUpdatePlaceStatus)

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('place mutations', () => {
  beforeEach(() => {
    mockedUseClearPinnedMaterial.mockReset()
    mockedUseCreatePlace.mockReset()
    mockedUseSetPinnedMaterial.mockReset()
    mockedUseUploadPlaceCoverPhoto.mockReset()
    mockedUseUpdatePlace.mockReset()
    mockedUseUpdatePlaceStatus.mockReset()
    vi.mocked(getGetAdminPlaceDetailQueryKey).mockImplementation(
      ({ placeId }) => [`/admin/places/${placeId}`],
    )
    vi.mocked(getListAdminPlacesQueryKey).mockReturnValue(['/admin/places'])
  })

  it('invalidates places list queries after creating a place', async () => {
    const queryClient = new QueryClient()
    const queryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const createdPlace: PlaceSummary = {
      category: 'spa',
      coverImageUrl: null,
      id: 'place-1',
      popularityWeight: 7,
      status: 'active',
      summary: 'Новый SPA в центре',
      tags: ['spa'],
      title: 'Тихий SPA',
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(queryKey, { items: [], page: 1, pageSize: 10 })
    mockedUseCreatePlace.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreatePlace>)

    renderHook(() => useCreatePlaceMutation({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await mockedUseCreatePlace.mock.calls[0]?.[0]?.mutation?.onSuccess?.(
      createdPlace,
      {
        data: {
          category: 'spa',
          summary: 'Новый SPA',
          tags: ['spa'],
          title: 'SPA',
        },
      },
      undefined,
      {} as never,
    )

    expect(
      queryClient.getQueryCache().find({ queryKey })?.state.isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(createdPlace)
  })

  it('invalidates places list and detail queries after updating status', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/admin/places/place-2']
    const updatedPlace: PlaceSummary = {
      category: 'spa',
      coverImageUrl: null,
      id: 'place-2',
      popularityWeight: 5,
      status: 'active',
      summary: 'SPA вернулся в каталог',
      tags: ['spa'],
      title: 'Скрытый SPA',
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
    mockedUseUpdatePlaceStatus.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdatePlaceStatus>)

    renderHook(() => useUpdatePlaceStatusMutation({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await mockedUseUpdatePlaceStatus.mock.calls[0]?.[0]?.mutation?.onSuccess?.(
      updatedPlace,
      {
        data: { status: 'active' },
        pathParams: { placeId: 'place-2' },
      },
      undefined,
      {} as never,
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

  it('invalidates places list and detail queries after updating place fields', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/admin/places/place-3']
    const updatedPlace: PlaceSummary = {
      category: 'cafe',
      coverImageUrl: null,
      id: 'place-3',
      popularityWeight: 12,
      status: 'active',
      summary: 'Кофейня с мастер-классами',
      tags: ['coffee'],
      title: 'Новая кофейня',
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
    mockedUseUpdatePlace.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdatePlace>)

    renderHook(() => useUpdatePlaceMutation({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await mockedUseUpdatePlace.mock.calls[0]?.[0]?.mutation?.onSuccess?.(
      updatedPlace,
      {
        data: { title: 'Новая кофейня' },
        pathParams: { placeId: 'place-3' },
      },
      undefined,
      {} as never,
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

  it('invalidates places list and detail queries after uploading cover photo', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/admin/places/place-4']
    const updatedPlace: PlaceSummary = {
      category: 'spa',
      coverImageUrl: '/places/place-4/photo',
      id: 'place-4',
      popularityWeight: 8,
      status: 'active',
      summary: 'SPA с новым фото',
      tags: ['spa'],
      title: 'Фото SPA',
    }
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
    mockedUseUploadPlaceCoverPhoto.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhoto>)

    renderHook(() => useUploadPlaceCoverPhotoMutation({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await mockedUseUploadPlaceCoverPhoto.mock.calls[0]?.[0]?.mutation?.onSuccess?.(
      updatedPlace,
      {
        data: { photo: file },
        pathParams: { placeId: 'place-4' },
      },
      undefined,
      {} as never,
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

  it('invalidates admin detail query after setting pinned material', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/admin/places/place-5']
    const updatedPlace: PlaceDetail = {
      category: 'spa',
      counters: {
        dzen: 0,
        instagram: 0,
        telegram: 1,
      },
      coverImageUrl: null,
      id: 'place-5',
      pinnedMaterial: {
        durationSec: null,
        id: 'material-1',
        placeId: 'place-5',
        platform: 'telegram',
        publishedAt: '2026-03-20T10:30:00+05:00',
        title: 'Стартовый обзор',
        type: 'post',
        redirectUrl: '/v1/materials/material-1/go',
      },
      popularityWeight: 8,
      status: 'hidden',
      summary: 'SPA со стартовым материалом',
      tags: ['spa'],
      title: 'Pinned SPA',
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
    mockedUseSetPinnedMaterial.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSetPinnedMaterial>)

    renderHook(() => useSetPinnedMaterialMutation({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await mockedUseSetPinnedMaterial.mock.calls[0]?.[0]?.mutation?.onSuccess?.(
      updatedPlace,
      {
        data: { materialId: 'material-1' },
        pathParams: { placeId: 'place-5' },
      },
      undefined,
      {} as never,
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

  it('invalidates admin detail query after clearing pinned material', async () => {
    const queryClient = new QueryClient()
    const listQueryKey = ['/admin/places', { page: 1, pageSize: 10 }]
    const detailQueryKey = ['/admin/places/place-6']
    const updatedPlace: PlaceDetail = {
      category: 'spa',
      counters: {
        dzen: 0,
        instagram: 0,
        telegram: 1,
      },
      coverImageUrl: null,
      id: 'place-6',
      pinnedMaterial: null,
      popularityWeight: 8,
      status: 'hidden',
      summary: 'SPA без закрепления',
      tags: ['spa'],
      title: 'Unpinned SPA',
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(listQueryKey, { items: [], page: 1, pageSize: 10 })
    queryClient.setQueryData(detailQueryKey, updatedPlace)
    mockedUseClearPinnedMaterial.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useClearPinnedMaterial>)

    renderHook(() => useClearPinnedMaterialMutation({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await mockedUseClearPinnedMaterial.mock.calls[0]?.[0]?.mutation?.onSuccess?.(
      updatedPlace,
      {
        pathParams: { placeId: 'place-6' },
      },
      undefined,
      {} as never,
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
})
