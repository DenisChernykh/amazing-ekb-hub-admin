import { CreatePlaceForm } from '@/features/place/create/ui/create-place-form'
import { Card, Flex, Typography } from 'antd'
import { useNavigate } from 'react-router'

/**
 * Экран создания места с layout-оберткой и возвратом к списку после действий.
 */
export function PlaceCreateScreen() {
  const navigate = useNavigate()
  const navigateToPlaces = () => {
    navigate('/places')
  }

  return (
    <Flex gap={16} vertical>
      <Typography.Title level={2}>Новое место</Typography.Title>

      <Card>
        <CreatePlaceForm
          onCancel={navigateToPlaces}
          onCreated={navigateToPlaces}
        />
      </Card>
    </Flex>
  )
}
