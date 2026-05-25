import { CreatePlaceForm } from '@/features/place/create/ui/create-place-form'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import { Card, Flex, Typography } from 'antd'
import { useNavigate } from 'react-router'

/**
 * Экран создания места с layout-оберткой, отменой в список и переходом к созданному месту.
 */
export function PlaceCreateScreen() {
  const navigate = useNavigate()
  const navigateToPlaces = () => {
    navigate('/places')
  }
  const navigateToCreatedPlace = (placeId: string) => {
    navigate(`/places/${placeId}`)
  }

  return (
    <>
      <DocumentTitle title="Новое место" />
      <Flex gap={16} vertical>
        <Typography.Title level={2}>Новое место</Typography.Title>

        <Card>
          <CreatePlaceForm
            onCancel={navigateToPlaces}
            onCreated={navigateToCreatedPlace}
          />
        </Card>
      </Flex>
    </>
  )
}
