import type {
  AdminCollectionDetailResponseDto,
  AdminCollectionListResponseDto,
} from '@/shared/api'
import {
  adminCollectionsGet,
  adminCollectionsList,
  getAdminCollectionsGetQueryKey,
  getAdminCollectionsListQueryKey,
} from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCollectionDetailQuery,
  useCollectionsQuery,
} from './collection-hooks'

vi.mock('@/shared/api', () => ({
  adminCollectionsGet: vi.fn(),
  adminCollectionsList: vi.fn(),
  getAdminCollectionsGetQueryKey: vi.fn(({ collectionId }) => [
    `/v1/admin/collections/${collectionId}`,
  ]),
  getAdminCollectionsListQueryKey: vi.fn(() => ['/v1/admin/collections']),
}))

const wrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

const list: AdminCollectionListResponseDto = { items: [] }
const detail: AdminCollectionDetailResponseDto = {
  activePlaceCount: 0,
  coverImageUrl: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  description: null,
  hiddenPlaceCount: 0,
  id: 'collection-1',
  places: [],
  position: 0,
  slug: 'collection-1',
  status: 'draft',
  title: 'Подборка',
  updatedAt: '2026-08-01T00:00:00.000Z',
}

describe('collection query bridges', () => {
  beforeEach(() => {
    vi.mocked(adminCollectionsGet).mockReset()
    vi.mocked(adminCollectionsList).mockReset()
  })

  it('loads the collection list through the shared list key', async () => {
    vi.mocked(adminCollectionsList).mockResolvedValue(list)
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useCollectionsQuery(), {
      wrapper: wrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(adminCollectionsList).toHaveBeenCalledWith(
      undefined,
      expect.anything(),
    )
    expect(getAdminCollectionsListQueryKey).toHaveBeenCalled()
  })

  it('loads keyed collection detail', async () => {
    vi.mocked(adminCollectionsGet).mockResolvedValue(detail)
    const queryClient = new QueryClient()
    const { result } = renderHook(
      () => useCollectionDetailQuery('collection-1'),
      { wrapper: wrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(adminCollectionsGet).toHaveBeenCalledWith(
      { collectionId: 'collection-1' },
      undefined,
      expect.anything(),
    )
    expect(getAdminCollectionsGetQueryKey).toHaveBeenCalledWith({
      collectionId: 'collection-1',
    })
  })
})
