import {
  getAdminCollectionsGetQueryKey,
  getAdminCollectionsListQueryKey,
  getAdminPlacesListQueryKey,
} from '@/shared/api'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import {
  invalidateCollectionDetailQuery,
  invalidateCollectionListQueries,
  invalidateCollectionMembershipQueries,
  invalidateCollectionOrderQueries,
  invalidateCollectionQueries,
} from './collection-cache'

vi.mock('@/shared/api', () => ({
  getAdminCollectionsGetQueryKey: vi.fn(({ collectionId }) => [
    `/v1/admin/collections/${collectionId}`,
  ]),
  getAdminCollectionsListQueryKey: vi.fn(() => ['/v1/admin/collections']),
  getAdminPlacesListQueryKey: vi.fn(() => ['/v1/admin/places']),
}))

describe('collection cache helpers', () => {
  it('uses one list key and keyed detail keys', async () => {
    const queryClient = new QueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateCollectionListQueries(queryClient)
    await invalidateCollectionDetailQuery(queryClient, 'collection-1')

    expect(invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: ['/v1/admin/collections'],
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: ['/v1/admin/collections/collection-1'],
    })
  })

  it('invalidates collection and place-list caches after membership changes', async () => {
    const queryClient = new QueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateCollectionMembershipQueries(queryClient, 'collection-2')

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/v1/admin/collections'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/v1/admin/collections/collection-2'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/v1/admin/places'],
    })
  })

  it('invalidates every reordered collection detail together with the list', async () => {
    const queryClient = new QueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateCollectionOrderQueries(queryClient, [
      'collection-1',
      'collection-2',
    ])

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/v1/admin/collections'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/v1/admin/collections/collection-1'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/v1/admin/collections/collection-2'],
    })
  })

  it('can invalidate all collection caches together', async () => {
    const queryClient = new QueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateCollectionQueries(queryClient, 'collection-3')

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: getAdminCollectionsListQueryKey(),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: getAdminCollectionsGetQueryKey({
        collectionId: 'collection-3',
      }),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: getAdminPlacesListQueryKey(),
    })
  })
})
