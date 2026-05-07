import { PlaceEditScreen } from '@/widgets/place-edit/ui/place-edit-screen'
import { Navigate, useParams } from 'react-router'

/**
 * Тонкая route-page для редактирования административной карточки места.
 *
 * @remarks Берет `placeId` из URL и передает его в screen; без параметра возвращает пользователя к списку мест.
 */
export function PlaceEditPage() {
  const { placeId } = useParams()

  if (!placeId) {
    return <Navigate replace to="/places" />
  }

  return <PlaceEditScreen placeId={placeId} />
}
