import {
  getGetAdminPlaceDetailQueryKey,
  getListAdminMaterialLibraryQueryKey,
  getListAdminPlaceMaterialsQueryKey,
  hidePlaceMaterialLink,
  linkPlaceMaterial,
  updateMaterial,
  updateMaterialAdminStatus,
  useCreatePlaceMaterial,
} from '@/shared/api/generated/admin/admin'
import type {
  AdminMaterialLibraryItem,
  Material,
} from '@/shared/api/generated/model'
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

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getGetAdminPlaceDetailQueryKey: vi.fn(({ placeId }) => [
    `/admin/places/${placeId}`,
  ]),
  getListAdminPlaceMaterialsQueryKey: vi.fn(({ placeId }) => [
    `/admin/places/${placeId}/materials`,
  ]),
  hidePlaceMaterialLink: vi.fn(),
  linkPlaceMaterial: vi.fn(),
  getListAdminMaterialLibraryQueryKey: vi.fn(() => ['/admin/materials']),
  updateMaterial: vi.fn(),
  updateMaterialAdminStatus: vi.fn(),
  useCreatePlaceMaterial: vi.fn(),
}))

const mockedUseCreatePlaceMaterial = vi.mocked(useCreatePlaceMaterial)
const mockedHidePlaceMaterialLink = vi.mocked(hidePlaceMaterialLink)
const mockedLinkPlaceMaterial = vi.mocked(linkPlaceMaterial)
const mockedUpdateMaterial = vi.mocked(updateMaterial)
const mockedUpdateMaterialAdminStatus = vi.mocked(updateMaterialAdminStatus)

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const material: Material = {
  durationSec: null,
  id: 'material-1',
  placeId: 'place-1',
  platform: 'telegram',
  publishedAt: '2026-03-20T10:30:00+05:00',
  title: 'Обзор комплекса',
  type: 'post',
  url: 'https://t.me/amazing_ekb/321',
}

const libraryItem: AdminMaterialLibraryItem = {
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
    mockedUseCreatePlaceMaterial.mockReset()
    mockedHidePlaceMaterialLink.mockReset()
    mockedLinkPlaceMaterial.mockReset()
    mockedUpdateMaterial.mockReset()
    vi.mocked(getGetAdminPlaceDetailQueryKey).mockImplementation(
      ({ placeId }) => [`/admin/places/${placeId}`],
    )
    vi.mocked(getListAdminPlaceMaterialsQueryKey).mockImplementation(
      ({ placeId }) => [`/admin/places/${placeId}/materials`],
    )
    vi.mocked(getListAdminMaterialLibraryQueryKey).mockImplementation(() => [
      '/admin/materials',
    ])
  })

  it('invalidates materials list and admin detail after creating material', async () => {
    const queryClient = new QueryClient()
    const materialsQueryKey = ['/admin/places/place-1/materials']
    const detailQueryKey = ['/admin/places/place-1']
    const onSuccess = vi.fn()
    queryClient.setQueryData(materialsQueryKey, { items: [] })
    queryClient.setQueryData(detailQueryKey, { id: 'place-1' })
    mockedUseCreatePlaceMaterial.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreatePlaceMaterial>)

    renderHook(() => useCreatePlaceMaterialMutation({ onSuccess }), {
      wrapper: createWrapper(queryClient),
    })

    await mockedUseCreatePlaceMaterial.mock.calls[0]?.[0]?.mutation?.onSuccess?.(
      material,
      {
        data: {
          durationSec: null,
          platform: 'telegram',
          publishedAt: '2026-03-20T10:30:00+05:00',
          title: 'Обзор комплекса',
          type: 'post',
          url: 'https://t.me/amazing_ekb/321',
        },
        pathParams: { placeId: 'place-1' },
      },
      undefined,
      {} as never,
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

  it('invalidates materials list and admin detail after updating material', async () => {
    const queryClient = new QueryClient()
    const materialsQueryKey = ['/admin/places/place-1/materials']
    const detailQueryKey = ['/admin/places/place-1']
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
    const allMaterialsQueryKey = ['/admin/materials']
    const filteredMaterialsQueryKey = [
      '/admin/materials',
      { adminStatus: 'pending' },
    ]
    const approvedItem: AdminMaterialLibraryItem = {
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
    const materialsQueryKey = ['/admin/places/place-1/materials']
    const detailQueryKey = ['/admin/places/place-1']
    const allMaterialsQueryKey = ['/admin/materials']
    const filteredMaterialsQueryKey = [
      '/admin/materials',
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

  it('hides place-material link and invalidates material dependencies', async () => {
    const queryClient = new QueryClient()
    const materialsQueryKey = ['/admin/places/place-1/materials']
    const detailQueryKey = ['/admin/places/place-1']
    const allMaterialsQueryKey = ['/admin/materials']
    const onSuccess = vi.fn()
    queryClient.setQueryData(materialsQueryKey, { items: [material] })
    queryClient.setQueryData(detailQueryKey, { id: 'place-1' })
    queryClient.setQueryData(allMaterialsQueryKey, { items: [libraryItem] })
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
    expect(onSuccess).toHaveBeenCalled()
  })
})
