import { useAdminPlaceDetailQuery } from '@/entities/place/model/place-hooks'
import { EditPlaceForm } from '@/features/place/edit/ui/edit-place-form'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { PlaceSummary } from '@/shared/api/generated/model'
import { Alert, Card, Flex, Modal, Spin, Typography } from 'antd'
import { useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router'

/**
 * Props экрана редактирования административной карточки места.
 */
export type PlaceEditScreenProps = {
  placeId: string
}

/**
 * Экран редактирования места с загрузкой admin detail и блокировкой dirty-навигации.
 *
 * @remarks Использует `useBlocker`, поэтому должен рендериться внутри data-router.
 */
export function PlaceEditScreen({ placeId }: PlaceEditScreenProps) {
  const navigate = useNavigate()
  const allowNavigationRef = useRef(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const placeQuery = useAdminPlaceDetailQuery(placeId)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      hasUnsavedChanges &&
      !allowNavigationRef.current &&
      currentLocation.pathname !== nextLocation.pathname
    )
  })

  const navigateToDetail = (updatedPlace: Pick<PlaceSummary, 'id'>) => {
    allowNavigationRef.current = true
    setHasUnsavedChanges(false)
    navigate(`/places/${updatedPlace.id}`)
  }

  const handleConfirmLeave = () => {
    allowNavigationRef.current = true
    setHasUnsavedChanges(false)
    blocker.proceed?.()
  }

  if (placeQuery.isPending) {
    return <Spin />
  }

  if (placeQuery.isError) {
    return (
      <Alert
        title={normalizeApiError(placeQuery.error).message}
        showIcon
        type="error"
      />
    )
  }

  const place = placeQuery.data

  if (!place) {
    return <Alert title="Место не найдено" showIcon type="warning" />
  }

  return (
    <Flex gap={16} vertical>
      <Typography.Title level={2}>Редактирование места</Typography.Title>

      <Card>
        <EditPlaceForm
          key={place.id}
          onCancel={() => navigate(`/places/${place.id}`)}
          onDirtyChange={setHasUnsavedChanges}
          onUpdated={navigateToDetail}
          place={place}
        />
      </Card>

      <Modal
        cancelText="Остаться"
        okText="Уйти без сохранения"
        onCancel={() => blocker.reset?.()}
        onOk={handleConfirmLeave}
        open={blocker.state === 'blocked'}
        title="Есть несохраненные изменения"
      >
        <Typography.Text>
          Если уйти со страницы, изменения формы не сохранятся.
        </Typography.Text>
      </Modal>
    </Flex>
  )
}
