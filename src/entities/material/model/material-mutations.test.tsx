import {
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlaceMaterialsQueryKey,
  useCreatePlaceMaterial,
  useUpdateMaterial,
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
  useCreatePlaceMaterial: vi.fn(),
  useUpdateMaterial: vi.fn(),
}))

const mockedUseCreatePlaceMaterial = vi.mocked(useCreatePlaceMaterial)
const mockedUseUpdateMaterial = vi.mocked(useUpdateMaterial)

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
    mockedUseUpdateMaterial.mockReset()
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
    const generatedMutate = vi.fn()
    queryClient.setQueryData(materialsQueryKey, { items: [material] })
    queryClient.setQueryData(detailQueryKey, { id: 'place-1' })
    mockedUseUpdateMaterial.mockReturnValue({
      isPending: false,
      mutate: generatedMutate,
    } as unknown as ReturnType<typeof useUpdateMaterial>)

    const { result } = renderHook(
      () => useUpdateMaterialMutation({ onSuccess }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    result.current.mutate({
      data: { title: 'Новое название' },
      materialId: 'material-1',
      placeId: 'place-1',
    })

    expect(generatedMutate).toHaveBeenCalledWith(
      {
        data: { title: 'Новое название' },
        pathParams: { materialId: 'material-1' },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )

    await generatedMutate.mock.calls[0]?.[1]?.onSuccess?.(
      { ...material, title: 'Новое название' },
      {
        data: { title: 'Новое название' },
        pathParams: { materialId: 'material-1' },
      },
      undefined,
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
