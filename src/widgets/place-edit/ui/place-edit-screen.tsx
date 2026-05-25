import { useAdminPlaceDetailQuery } from '@/entities/place/model/place-hooks'
import { EditPlaceForm } from '@/features/place/edit/ui/edit-place-form'
import type { PlaceSummary } from '@/shared/api/generated/model'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenLoadingState,
  ScreenResultState,
} from '@/shared/ui/screen-state/screen-state'
import { Card, Flex, Modal, Typography } from 'antd'
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
    return (
      <>
        <DocumentTitle title="Редактирование места" />
        <ScreenLoadingState title="Загружаем место" />
      </>
    )
  }

  if (placeQuery.isError) {
    return (
      <>
        <DocumentTitle title="Ошибка редактирования" />
        <ScreenApiErrorState
          error={placeQuery.error}
          forbiddenAction={{ label: 'На главную', to: '/' }}
          notFoundAction={{ label: 'К списку мест', to: '/places' }}
          notFoundSubTitle="Место удалено или ссылка устарела."
          notFoundTitle="Место не найдено"
        />
      </>
    )
  }

  const place = placeQuery.data

  if (!place) {
    return (
      <>
        <DocumentTitle title="Место не найдено" />
        <ScreenResultState
          primaryAction={{ label: 'К списку мест', to: '/places' }}
          status="404"
          subTitle="Место удалено или ссылка устарела."
          title="Место не найдено"
        />
      </>
    )
  }

  return (
    <Flex gap={16} vertical>
      <DocumentTitle title={`Редактирование: ${place.title}`} />
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
