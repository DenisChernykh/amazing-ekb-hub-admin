import { useAdminPlaceDetailQuery } from '@/entities/place/model/place-hooks'
import { PlaceCategoryTag } from '@/entities/place/ui/place-category-tag'
import { PlaceStatusTag } from '@/entities/place/ui/place-status-tag'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { PlaceDetail } from '@/shared/api/generated/model'
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { Link } from 'react-router'

const formatCounters = (place: PlaceDetail) => [
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
      <Flex align="center" justify="space-between" wrap>
        <Typography.Title level={2}>{place.title}</Typography.Title>

        <Link to="/places">
          <Button>К списку мест</Button>
        </Link>
      </Flex>

      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Статус">
            <PlaceStatusTag status={place.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Категория">
            <PlaceCategoryTag category={place.category} />
          </Descriptions.Item>
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
          <Descriptions.Item label="Вес популярности">
            {place.popularityWeight}
          </Descriptions.Item>
          <Descriptions.Item label="Материалы">
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
