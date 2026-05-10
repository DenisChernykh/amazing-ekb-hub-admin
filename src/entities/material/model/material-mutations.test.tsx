import {
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlaceMaterialsQueryKey,
  updateMaterial,
  useCreatePlaceMaterial,
} from '@/shared/api/generated/admin/admin'
import type { Material } from '@/shared/api/generated/model'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCreatePlaceMaterialMutation,
  useUpdateMaterialMutation,
} from './material-mutations'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getGetAdminPlaceDetailQueryKey: vi.fn(({ placeId }) => [
    `/admin/places/${placeId}`,
  ]),
  getListAdminPlaceMaterialsQueryKey: vi.fn(({ placeId }) => [
    `/admin/places/${placeId}/materials`,
  ]),
  updateMaterial: vi.fn(),
  useCreatePlaceMaterial: vi.fn(),
}))

const mockedUseCreatePlaceMaterial = vi.mocked(useCreatePlaceMaterial)
const mockedUpdateMaterial = vi.mocked(updateMaterial)

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

describe('material mutations', () => {
  beforeEach(() => {
    mockedUseCreatePlaceMaterial.mockReset()
    mockedUpdateMaterial.mockReset()
    vi.mocked(getGetAdminPlaceDetailQueryKey).mockImplementation(
      ({ placeId }) => [`/admin/places/${placeId}`],
    )
    vi.mocked(getListAdminPlaceMaterialsQueryKey).mockImplementation(
      ({ placeId }) => [`/admin/places/${placeId}/materials`],
    )
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
})
