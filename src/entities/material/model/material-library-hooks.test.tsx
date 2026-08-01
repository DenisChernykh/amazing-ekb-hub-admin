import type { AdminMaterialLibraryListResponseDto } from '@/shared/api'
import { adminMaterialsList, getAdminMaterialsListQueryKey } from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMaterialLibraryQuery } from './material-library-hooks'

vi.mock('@/shared/api', () => ({
  getAdminMaterialsListQueryKey: vi.fn((params) => [
    '/v1/admin/materials',
    ...(params ? [params] : []),
  ]),
  adminMaterialsList: vi.fn(),
  useListAdminMaterialLibrary: vi.fn(() => ({
    data: undefined,
    isPending: true,
  })),
}))

const mockedListAdminMaterialLibrary = vi.mocked(adminMaterialsList)

const materialLibraryResponse: AdminMaterialLibraryListResponseDto = {
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
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

describe('material library hooks', () => {
  beforeEach(() => {
    mockedListAdminMaterialLibrary.mockReset()
    vi.mocked(getAdminMaterialsListQueryKey).mockClear()
  })

  it('loads admin material library through generated fetcher and query key', async () => {
    const queryClient = createQueryClient()
    const params = {
      adminStatus: 'pending' as const,
      linked: false,
      platform: 'telegram' as const,
    }
    mockedListAdminMaterialLibrary.mockResolvedValue(materialLibraryResponse)

    const { result } = renderHook(() => useMaterialLibraryQuery(params), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getAdminMaterialsListQueryKey).toHaveBeenCalledWith(params)
    expect(mockedListAdminMaterialLibrary).toHaveBeenCalledWith(
      params,
      undefined,
      expect.any(AbortSignal),
    )
    expect(result.current.data).toBe(materialLibraryResponse)
  })

  it('does not load material library while disabled', () => {
    const queryClient = createQueryClient()

    renderHook(() => useMaterialLibraryQuery(undefined, { enabled: false }), {
      wrapper: createWrapper(queryClient),
    })

    expect(mockedListAdminMaterialLibrary).not.toHaveBeenCalled()
  })
})
