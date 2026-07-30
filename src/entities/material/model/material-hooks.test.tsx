import type { MaterialListResponseDto } from '@/shared/api'
import {
  adminPlaceMaterialsList,
  getAdminPlaceMaterialsListQueryKey,
} from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlaceMaterialsListQuery } from './material-hooks'

vi.mock('@/shared/api', () => ({
  getAdminPlaceMaterialsListQueryKey: vi.fn(({ placeId }, params) => [
    `/v1/admin/places/${placeId}/materials`,
    ...(params ? [params] : []),
  ]),
  adminPlaceMaterialsList: vi.fn(),
  useListAdminPlaceMaterials: vi.fn(() => ({
    data: undefined,
    isPending: true,
  })),
}))

const mockedListAdminPlaceMaterials = vi.mocked(adminPlaceMaterialsList)

const materialListResponse: MaterialListResponseDto = {
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
    vi.mocked(getAdminPlaceMaterialsListQueryKey).mockClear()
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

    expect(getAdminPlaceMaterialsListQueryKey).toHaveBeenCalledWith(
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
