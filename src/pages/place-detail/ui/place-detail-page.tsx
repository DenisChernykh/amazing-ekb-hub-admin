import { PlaceDetailScreen } from '@/widgets/place-detail/ui/place-detail-screen'
import { Navigate, useParams } from 'react-router'

/**
 * Тонкая route-page для административной detail-карточки места.
 *
 * @remarks Берет `placeId` из URL и передает его в screen; без параметра возвращает пользователя к списку мест.
 */
export function PlaceDetailPage() {
  const { placeId } = useParams()

  if (!placeId) {
    return <Navigate replace to="/places" />
  }

  return <PlaceDetailScreen placeId={placeId} />
}
