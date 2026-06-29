import {
  getListAdminPlaceMaterialsQueryKey,
  listAdminPlaceMaterials,
} from '@/shared/api/generated/admin/admin'
import type { MaterialListResponse } from '@/shared/api/generated/operation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlaceMaterialsListQuery } from './material-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getListAdminPlaceMaterialsQueryKey: vi.fn(({ placeId }, params) => [
    `/admin/places/${placeId}/materials`,
    ...(params ? [params] : []),
  ]),
  listAdminPlaceMaterials: vi.fn(),
  useListAdminPlaceMaterials: vi.fn(() => ({
    data: undefined,
    isPending: true,
  })),
}))

const mockedListAdminPlaceMaterials = vi.mocked(listAdminPlaceMaterials)

const materialListResponse: MaterialListResponse = {
  items: [],
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

describe('material hooks', () => {
  beforeEach(() => {
    mockedListAdminPlaceMaterials.mockReset()
    vi.mocked(getListAdminPlaceMaterialsQueryKey).mockClear()
  })

  it('loads place materials through generated fetcher and query key', async () => {
    const queryClient = createQueryClient()
    const params = { platform: 'telegram' as const }
    mockedListAdminPlaceMaterials.mockResolvedValue(materialListResponse)

    const { result } = renderHook(
      () => usePlaceMaterialsListQuery('place-1', params),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getListAdminPlaceMaterialsQueryKey).toHaveBeenCalledWith(
      { placeId: 'place-1' },
      params,
    )
    expect(mockedListAdminPlaceMaterials).toHaveBeenCalledWith(
      { placeId: 'place-1' },
      params,
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(materialListResponse)
  })
})
