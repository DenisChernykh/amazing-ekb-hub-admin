import { CollectionDetailScreen } from '@/widgets/collection-detail/ui/collection-detail-screen'
import { Navigate, useParams, useSearchParams } from 'react-router'

/** Тонкая route-page detail подборки с optional highlight query. */
export function CollectionDetailPage() {
  const { collectionId } = useParams()
  const [searchParams] = useSearchParams()
  if (!collectionId) return <Navigate replace to="/collections" />
  return (
    <CollectionDetailScreen
      addedPlaceId={searchParams.get('addedPlaceId')}
      collectionId={collectionId}
    />
  )
}
