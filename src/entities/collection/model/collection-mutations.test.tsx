import type {
  AdminCollectionSummaryResponseDto,
  CreateCollectionDto,
} from '@/shared/api'
import {
  adminCollectionsCreate,
  adminCollectionsDelete,
  adminCollectionsUpdate,
  adminCollectionsUpdateStatus,
  getAdminCollectionsGetQueryKey,
  getAdminCollectionsListQueryKey,
} from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useUpdateCollectionMutation,
  useUpdateCollectionStatusMutation,
} from './collection-mutations'

vi.mock('@/shared/api', () => ({
  adminCollectionsCreate: vi.fn(),
  adminCollectionsDelete: vi.fn(),
  adminCollectionsUpdate: vi.fn(),
  adminCollectionsUpdateStatus: vi.fn(),
  getAdminCollectionsGetQueryKey: vi.fn(({ collectionId }) => [
    `/v1/admin/collections/${collectionId}`,
  ]),
  getAdminCollectionsListQueryKey: vi.fn(() => ['/v1/admin/collections']),
  getAdminPlacesListQueryKey: vi.fn(() => ['/v1/admin/places']),
}))

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

const summary: AdminCollectionSummaryResponseDto = {
  activePlaceCount: 1,
  coverImageUrl: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  description: null,
  hiddenPlaceCount: 0,
  id: 'collection-1',
  position: 0,
  slug: 'spa',
  status: 'draft',
  title: 'SPA',
  updatedAt: '2026-08-01T00:00:00.000Z',
}
const listResponse = { items: [summary] }

describe('collection mutations', () => {
  beforeEach(() => {
    vi.mocked(adminCollectionsCreate).mockReset()
    vi.mocked(adminCollectionsDelete).mockReset()
    vi.mocked(adminCollectionsUpdate).mockReset()
    vi.mocked(adminCollectionsUpdateStatus).mockReset()
  })

  it('creates and invalidates the collection list', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(getAdminCollectionsListQueryKey(), listResponse)
    vi.mocked(adminCollectionsCreate).mockResolvedValue(summary)
    const { result } = renderHook(() => useCreateCollectionMutation(), {
      wrapper: createWrapper(queryClient),
    })
    const data: CreateCollectionDto = { title: 'SPA' }

    await result.current.mutateAsync(data)

    expect(adminCollectionsCreate).toHaveBeenCalledWith(data)
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: getAdminCollectionsListQueryKey() })?.state
        .isInvalidated,
    ).toBe(true)
  })

  it('updates fields and invalidates list plus detail', async () => {
    const queryClient = new QueryClient()
    const detailKey = getAdminCollectionsGetQueryKey({
      collectionId: 'collection-1',
    })
    queryClient.setQueryData(detailKey, summary)
    queryClient.setQueryData(getAdminCollectionsListQueryKey(), listResponse)
    vi.mocked(adminCollectionsUpdate).mockResolvedValue(summary)
    const { result } = renderHook(() => useUpdateCollectionMutation(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({
      collectionId: 'collection-1',
      data: { title: 'Новое' },
    })

    expect(adminCollectionsUpdate).toHaveBeenCalledWith(
      { collectionId: 'collection-1' },
      { title: 'Новое' },
    )
    expect(
      queryClient.getQueryCache().find({ queryKey: detailKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: getAdminCollectionsListQueryKey() })?.state
        .isInvalidated,
    ).toBe(true)
  })

  it('updates status and deletes with keyed invalidation', async () => {
    const queryClient = new QueryClient()
    const detailKey = getAdminCollectionsGetQueryKey({
      collectionId: 'collection-1',
    })
    queryClient.setQueryData(detailKey, summary)
    vi.mocked(adminCollectionsUpdateStatus).mockResolvedValue(summary)
    vi.mocked(adminCollectionsDelete).mockResolvedValue(undefined)
    const { result } = renderHook(
      () => ({
        status: useUpdateCollectionStatusMutation(),
        remove: useDeleteCollectionMutation(),
      }),
      { wrapper: createWrapper(queryClient) },
    )

    await result.current.status.mutateAsync({
      collectionId: 'collection-1',
      data: { status: 'active' },
    })
    await result.current.remove.mutateAsync({ collectionId: 'collection-1' })

    expect(adminCollectionsUpdateStatus).toHaveBeenCalledWith(
      { collectionId: 'collection-1' },
      { status: 'active' },
    )
    expect(adminCollectionsDelete).toHaveBeenCalledWith({
      collectionId: 'collection-1',
    })
    expect(
      queryClient.getQueryCache().find({ queryKey: detailKey })?.state
        .isInvalidated,
    ).toBe(true)
  })
})
