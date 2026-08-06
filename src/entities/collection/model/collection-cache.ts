import {
  getAdminCollectionsGetQueryKey,
  getAdminCollectionsListQueryKey,
  getAdminPlacesListQueryKey,
} from '@/shared/api'
import type { QueryClient } from '@tanstack/react-query'

/** Инвалидирует общий список административных подборок. */
export function invalidateCollectionListQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: getAdminCollectionsListQueryKey(),
  })
}

/** Инвалидирует detail-cache одной подборки. */
export function invalidateCollectionDetailQuery(
  queryClient: QueryClient,
  collectionId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: getAdminCollectionsGetQueryKey({ collectionId }),
  })
}

/** Инвалидирует список и все затронутые details после глобального reorder. */
export function invalidateCollectionOrderQueries(
  queryClient: QueryClient,
  collectionIds: string[],
) {
  return Promise.all([
    invalidateCollectionListQueries(queryClient),
    ...collectionIds.map((collectionId) =>
      invalidateCollectionDetailQuery(queryClient, collectionId),
    ),
  ])
}

/** Инвалидирует все caches, зависящие от membership подборки. */
export function invalidateCollectionMembershipQueries(
  queryClient: QueryClient,
  collectionId: string,
) {
  return Promise.all([
    invalidateCollectionListQueries(queryClient),
    invalidateCollectionDetailQuery(queryClient, collectionId),
    queryClient.invalidateQueries({ queryKey: getAdminPlacesListQueryKey() }),
  ])
}

/** Инвалидирует список, detail и places после мутаций коллекции. */
export function invalidateCollectionQueries(
  queryClient: QueryClient,
  collectionId: string,
) {
  return invalidateCollectionMembershipQueries(queryClient, collectionId)
}
