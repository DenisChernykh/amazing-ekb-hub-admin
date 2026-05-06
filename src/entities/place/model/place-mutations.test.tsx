import {
  getListAdminPlacesQueryKey,
  useCreatePlace,
} from '@/shared/api/generated/admin/admin'
import type { PlaceSummary } from '@/shared/api/generated/model'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreatePlaceMutation } from './place-mutations'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getListAdminPlacesQueryKey: vi.fn(() => ['/admin/places']),
  useCreatePlace: vi.fn(),
}))

const mockedUseCreatePlace = vi.mocked(useCreatePlace)

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('place mutations', () => {
  beforeEach(() => {
    mockedUseCreatePlace.mockReset()
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
})
