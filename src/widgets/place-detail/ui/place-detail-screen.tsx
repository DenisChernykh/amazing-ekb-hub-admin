import { useAdminPlaceDetailQuery } from '@/entities/place/model/place-hooks'
import { PlaceCategoryTag } from '@/entities/place/ui/place-category-tag'
import { PlaceStatusTag } from '@/entities/place/ui/place-status-tag'
import { PlaceCoverUploadPanel } from '@/features/place/cover/ui/place-cover-upload-panel'
import { PlaceStatusPanel } from '@/features/place/status/ui/place-status-panel'
import type { PlaceDetailResponseDto } from '@/shared/api'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenLoadingState,
  ScreenResultState,
} from '@/shared/ui/screen-state/screen-state'
import { Button, Card, Descriptions, Flex, Space, Tag, Typography } from 'antd'
import { Link } from 'react-router'
import { PlaceMaterialsPanel } from './place-materials-panel'

const formatCounters = (place: PlaceDetailResponseDto) => [
  `telegram: ${place.counters.telegram}`,
  `dzen: ${place.counters.dzen}`,
  `instagram: ${place.counters.instagram}`,
]

/**
 * Props read-only экрана административной карточки места.
 */
export type PlaceDetailScreenProps = {
  placeId: string
}

/**
 * Read-only экран административной карточки места.
 *
 * @remarks Загружает данные через admin detail endpoint, поэтому может показывать hidden places.
 */
export function PlaceDetailScreen({ placeId }: PlaceDetailScreenProps) {
  const placeQuery = useAdminPlaceDetailQuery(placeId)

  if (placeQuery.isPending) {
    return (
      <>
        <DocumentTitle title="Место" />
        <ScreenLoadingState title="Загружаем место" />
      </>
    )
  }

  if (placeQuery.isError) {
    return (
      <>
        <DocumentTitle title="Ошибка места" />
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
      <DocumentTitle title={place.title} />
      <Flex align="center" justify="space-between" wrap>
        <Typography.Title level={2}>{place.title}</Typography.Title>

        <Space wrap>
          <Link to={`/places/${place.id}/edit`}>
            <Button type="primary">Редактировать</Button>
          </Link>
          <Link to="/places">
            <Button>К списку мест</Button>
          </Link>
        </Space>
      </Flex>

      <PlaceStatusPanel
        key={`${place.id}:${place.status}`}
        placeId={place.id}
        status={place.status}
      />

      <PlaceCoverUploadPanel
        key={place.id}
        coverImageUrl={place.coverImageUrl}
        placeId={place.id}
      />

      <PlaceMaterialsPanel
        key={`materials:${place.id}`}
        pinnedMaterial={place.pinnedMaterial}
        placeId={place.id}
      />

      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Статус">
            <PlaceStatusTag status={place.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Категория">
            <PlaceCategoryTag category={place.category} />
          </Descriptions.Item>
          <Descriptions.Item label="Ярлык">{place.slug}</Descriptions.Item>
          <Descriptions.Item label="Описание">
            {place.summary}
          </Descriptions.Item>
          <Descriptions.Item label="Теги">
            <Space size={[4, 4]} wrap>
              {place.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Счетчики материалов">
            <Space size={[8, 4]} wrap>
              {formatCounters(place).map((counter) => (
                <Typography.Text key={counter}>{counter}</Typography.Text>
              ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Закрепленный материал">
            {place.pinnedMaterial?.title ?? 'Материал не закреплен'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Flex>
  )
}
