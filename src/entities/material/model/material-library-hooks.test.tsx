import {
  getListAdminMaterialLibraryQueryKey,
  listAdminMaterialLibrary,
} from '@/shared/api/generated/admin/admin'
import type { AdminMaterialLibraryListResponse } from '@/shared/api/generated/operation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMaterialLibraryQuery } from './material-library-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getListAdminMaterialLibraryQueryKey: vi.fn((params) => [
    '/admin/materials',
    ...(params ? [params] : []),
  ]),
  listAdminMaterialLibrary: vi.fn(),
  useListAdminMaterialLibrary: vi.fn(() => ({
    data: undefined,
    isPending: true,
  })),
}))

const mockedListAdminMaterialLibrary = vi.mocked(listAdminMaterialLibrary)

const materialLibraryResponse: AdminMaterialLibraryListResponse = {
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
    vi.mocked(getListAdminMaterialLibraryQueryKey).mockClear()
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

    expect(getListAdminMaterialLibraryQueryKey).toHaveBeenCalledWith(params)
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
