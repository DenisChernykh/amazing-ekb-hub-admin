import type {
  AdminMaterialLibraryResponseDto,
  MaterialResponseDto,
} from '@/shared/api'
import {
  adminMaterialsUpdate,
  adminMaterialsUpdateStatus,
  adminPlaceMaterialsCreate,
  adminPlaceMaterialsHide,
  adminPlaceMaterialsLink,
  getAdminMaterialsListQueryKey,
  getAdminPlaceMaterialsListQueryKey,
  getAdminPlacesGetQueryKey,
} from '@/shared/api'
import { ApiClientError } from '@/shared/api/client/api-error'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCreatePlaceMaterialMutation,
  useHidePlaceMaterialLinkMutation,
  useLinkPlaceMaterialMutation,
  useUpdateMaterialAdminStatusMutation,
  useUpdateMaterialMutation,
} from './material-mutations'

vi.mock('@/shared/api', () => ({
  getAdminPlacesGetQueryKey: vi.fn(({ placeId }) => [
    `/v1/admin/places/${placeId}`,
  ]),
  getAdminPlaceMaterialsListQueryKey: vi.fn(({ placeId }) => [
    `/v1/admin/places/${placeId}/materials`,
  ]),
  adminPlaceMaterialsCreate: vi.fn(),
  adminPlaceMaterialsHide: vi.fn(),
  adminPlaceMaterialsLink: vi.fn(),
  getAdminMaterialsListQueryKey: vi.fn(() => ['/v1/admin/materials']),
  adminMaterialsUpdate: vi.fn(),
  adminMaterialsUpdateStatus: vi.fn(),
  useCreatePlaceMaterial: vi.fn(),
}))

const mockedCreatePlaceMaterial = vi.mocked(adminPlaceMaterialsCreate)
const mockedHidePlaceMaterialLink = vi.mocked(adminPlaceMaterialsHide)
const mockedLinkPlaceMaterial = vi.mocked(adminPlaceMaterialsLink)
const mockedUpdateMaterial = vi.mocked(adminMaterialsUpdate)
const mockedUpdateMaterialAdminStatus = vi.mocked(adminMaterialsUpdateStatus)

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const material: MaterialResponseDto = {
  durationSec: null,
  id: 'material-1',
  placeId: 'place-1',
  platform: 'telegram',
  publishedAt: '2026-03-20T10:30:00+05:00',
  redirectUrl: null,
  title: 'Обзор комплекса',
  type: 'post',
  url: 'https://t.me/amazing_ekb/321',
}

const libraryItem: AdminMaterialLibraryResponseDto = {
  adminStatus: 'pending',
  durationSec: null,
  excerpt: 'Пост из Telegram',
  externalId: '321',
  id: 'material-1',
  linked: false,
  mediaKind: 'photo',
  mediaPreviewUrl: null,
  platform: 'telegram',
  placeLink: null,
  publishedAt: '2026-03-20T10:30:00+05:00',
  source: {
    displayName: 'Amazing EKB Telegram',
    id: 'source-1',
    platform: 'telegram',
    url: 'https://t.me/amazing_ekb',
  },
  text: 'Пост из Telegram',
  title: null,
  type: 'post',
  url: 'https://t.me/amazing_ekb/321',
}

describe('material mutations', () => {
  beforeEach(() => {
    mockedCreatePlaceMaterial.mockReset()
    mockedHidePlaceMaterialLink.mockReset()
    mockedLinkPlaceMaterial.mockReset()
    mockedUpdateMaterial.mockReset()
    vi.mocked(getAdminPlacesGetQueryKey).mockImplementation(({ placeId }) => [
      `/v1/admin/places/${placeId}`,
    ])
    vi.mocked(getAdminPlaceMaterialsListQueryKey).mockImplementation(
      ({ placeId }) => [`/v1/admin/places/${placeId}/materials`],
    )
    vi.mocked(getAdminMaterialsListQueryKey).mockImplementation(() => [
      '/v1/admin/materials',
    ])
  })

  it('invalidates materials list and admin detail after creating material', async () => {
    const queryClient = new QueryClient()
    const materialsQueryKey = ['/v1/admin/places/place-1/materials']
    const detailQueryKey = ['/v1/admin/places/place-1']
    const onSuccess = vi.fn()
    queryClient.setQueryData(materialsQueryKey, { items: [] })
    queryClient.setQueryData(detailQueryKey, { id: 'place-1' })
    mockedCreatePlaceMaterial.mockResolvedValue(material)

    const { result } = renderHook(
      () => useCreatePlaceMaterialMutation({ onSuccess }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await result.current.mutateAsync({
      data: {
        durationSec: null,
        platform: 'telegram',
        publishedAt: '2026-03-20T10:30:00+05:00',
        title: 'Обзор комплекса',
        type: 'post',
        url: 'https://t.me/amazing_ekb/321',
      },
      pathParams: { placeId: 'place-1' },
    })

    expect(mockedCreatePlaceMaterial).toHaveBeenCalledWith(
      { placeId: 'place-1' },
      {
        durationSec: null,
        platform: 'telegram',
        publishedAt: '2026-03-20T10:30:00+05:00',
        title: 'Обзор комплекса',
        type: 'post',
        url: 'https://t.me/amazing_ekb/321',
      },
    )

    expect(
      queryClient.getQueryCache().find({ queryKey: materialsQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: detailQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(material)
  })

  it('passes create material errors to callback', async () => {
    const queryClient = new QueryClient()
    const apiError = new ApiClientError({
      kind: 'server',
      message: 'Create material unavailable',
      status: 500,
    })
    const onError = vi.fn()
    mockedCreatePlaceMaterial.mockRejectedValue(apiError)

    const { result } = renderHook(
      () => useCreatePlaceMaterialMutation({ onError }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await expect(
      result.current.mutateAsync({
        data: {
          platform: 'telegram',
          publishedAt: '2026-03-20T10:30:00+05:00',
          title: 'Обзор комплекса',
          type: 'post',
          url: 'https://t.me/amazing_ekb/321',
        },
        pathParams: { placeId: 'place-1' },
      }),
    ).rejects.toBe(apiError)
    expect(onError).toHaveBeenCalledWith(apiError)
  })

  it('invalidates materials list and admin detail after updating material', async () => {
    const queryClient = new QueryClient()
    const materialsQueryKey = ['/v1/admin/places/place-1/materials']
    const detailQueryKey = ['/v1/admin/places/place-1']
    const onSuccess = vi.fn()
    queryClient.setQueryData(materialsQueryKey, { items: [material] })
    queryClient.setQueryData(detailQueryKey, { id: 'place-1' })
    mockedUpdateMaterial.mockResolvedValue({
      ...material,
      title: 'Новое название',
    })

    const { result } = renderHook(
      () => useUpdateMaterialMutation({ onSuccess }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await result.current.mutateAsync({
      data: { title: 'Новое название' },
      materialId: 'material-1',
      placeId: 'place-1',
    })

    expect(mockedUpdateMaterial).toHaveBeenCalledWith(
      { materialId: 'material-1' },
      { title: 'Новое название' },
    )

    expect(
      queryClient.getQueryCache().find({ queryKey: materialsQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: detailQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith({
      ...material,
      title: 'Новое название',
    })
  })

  it('updates material admin status and invalidates all material library queries', async () => {
    const queryClient = new QueryClient()
    const allMaterialsQueryKey = ['/v1/admin/materials']
    const filteredMaterialsQueryKey = [
      '/v1/admin/materials',
      { adminStatus: 'pending' },
    ]
    const approvedItem: AdminMaterialLibraryResponseDto = {
      ...libraryItem,
      adminStatus: 'approved',
    }
    const onSuccess = vi.fn()
    queryClient.setQueryData(allMaterialsQueryKey, { items: [libraryItem] })
    queryClient.setQueryData(filteredMaterialsQueryKey, {
      items: [libraryItem],
    })
    mockedUpdateMaterialAdminStatus.mockResolvedValue(approvedItem)

    const { result } = renderHook(
      () => useUpdateMaterialAdminStatusMutation({ onSuccess }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await result.current.mutateAsync({
      adminStatus: 'approved',
      materialId: 'material-1',
    })

    expect(mockedUpdateMaterialAdminStatus).toHaveBeenCalledWith(
      { materialId: 'material-1' },
      { adminStatus: 'approved' },
    )
    expect(
      queryClient.getQueryCache().find({ queryKey: allMaterialsQueryKey })
        ?.state.isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: filteredMaterialsQueryKey })
        ?.state.isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(approvedItem)
  })

  it('links existing material to place and invalidates material dependencies', async () => {
    const queryClient = new QueryClient()
    const materialsQueryKey = ['/v1/admin/places/place-1/materials']
    const detailQueryKey = ['/v1/admin/places/place-1']
    const allMaterialsQueryKey = ['/v1/admin/materials']
    const filteredMaterialsQueryKey = [
      '/v1/admin/materials',
      { adminStatus: 'approved', linked: false, placeId: 'place-1' },
    ]
    const onSuccess = vi.fn()
    queryClient.setQueryData(materialsQueryKey, { items: [] })
    queryClient.setQueryData(detailQueryKey, { id: 'place-1' })
    queryClient.setQueryData(allMaterialsQueryKey, { items: [libraryItem] })
    queryClient.setQueryData(filteredMaterialsQueryKey, {
      items: [libraryItem],
    })
    mockedLinkPlaceMaterial.mockResolvedValue(material)

    const { result } = renderHook(
      () => useLinkPlaceMaterialMutation({ onSuccess }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await result.current.mutateAsync({
      materialId: 'material-1',
      placeId: 'place-1',
    })

    expect(mockedLinkPlaceMaterial).toHaveBeenCalledWith({
      materialId: 'material-1',
      placeId: 'place-1',
    })
    expect(
      queryClient.getQueryCache().find({ queryKey: materialsQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: detailQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: allMaterialsQueryKey })
        ?.state.isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: filteredMaterialsQueryKey })
        ?.state.isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(material)
  })

  it('passes normalized link errors to callback', async () => {
    const queryClient = new QueryClient()
    const apiError = new ApiClientError({
      kind: 'server',
      message: 'Link unavailable',
      status: 500,
    })
    const onError = vi.fn()
    mockedLinkPlaceMaterial.mockRejectedValue(apiError)

    const { result } = renderHook(
      () => useLinkPlaceMaterialMutation({ onError }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await expect(
      result.current.mutateAsync({
        materialId: 'material-1',
        placeId: 'place-1',
      }),
    ).rejects.toBe(apiError)
    expect(onError).toHaveBeenCalledWith(apiError)
  })

  it('hides place-material link and invalidates material dependencies', async () => {
    const queryClient = new QueryClient()
    const materialsQueryKey = ['/v1/admin/places/place-1/materials']
    const detailQueryKey = ['/v1/admin/places/place-1']
    const allMaterialsQueryKey = ['/v1/admin/materials']
    const filteredMaterialsQueryKey = [
      '/v1/admin/materials',
      { adminStatus: 'approved', placeId: 'place-1' },
    ]
    const onSuccess = vi.fn()
    queryClient.setQueryData(materialsQueryKey, { items: [material] })
    queryClient.setQueryData(detailQueryKey, { id: 'place-1' })
    queryClient.setQueryData(allMaterialsQueryKey, { items: [libraryItem] })
    queryClient.setQueryData(filteredMaterialsQueryKey, {
      items: [libraryItem],
    })
    mockedHidePlaceMaterialLink.mockResolvedValue(undefined)

    const { result } = renderHook(
      () => useHidePlaceMaterialLinkMutation({ onSuccess }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await result.current.mutateAsync({
      materialId: 'material-1',
      placeId: 'place-1',
    })

    expect(mockedHidePlaceMaterialLink).toHaveBeenCalledWith({
      materialId: 'material-1',
      placeId: 'place-1',
    })
    expect(
      queryClient.getQueryCache().find({ queryKey: materialsQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: detailQueryKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: allMaterialsQueryKey })
        ?.state.isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: filteredMaterialsQueryKey })
        ?.state.isInvalidated,
    ).toBe(true)
    expect(onSuccess).toHaveBeenCalled()
  })

  it('passes normalized hide errors to callback', async () => {
    const queryClient = new QueryClient()
    const apiError = new ApiClientError({
      kind: 'server',
      message: 'Hide unavailable',
      status: 500,
    })
    const onError = vi.fn()
    mockedHidePlaceMaterialLink.mockRejectedValue(apiError)

    const { result } = renderHook(
      () => useHidePlaceMaterialLinkMutation({ onError }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await expect(
      result.current.mutateAsync({
        materialId: 'material-1',
        placeId: 'place-1',
      }),
    ).rejects.toBe(apiError)
    expect(onError).toHaveBeenCalledWith(apiError)
  })
})
