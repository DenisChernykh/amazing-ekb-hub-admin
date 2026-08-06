import { CollectionStatusTag } from '@/entities/collection/ui/collection-status-tag'
import { CollectionStatusActions } from '@/features/collection/status/ui/collection-status-actions'
import type { AdminCollectionDetailResponseDto } from '@/shared/api'
import { Button, Flex, Typography } from 'antd'
import { Link } from 'react-router'

/** Header detail подборки with status and targeted Yandex launch. */
export function CollectionDetailHeader({
  collection,
  onEdit,
}: {
  collection: AdminCollectionDetailResponseDto
  onEdit: () => void
}) {
  return (
    <Flex align="center" justify="space-between" wrap>
      <Flex gap={12} vertical>
        <Typography.Title level={2}>{collection.title}</Typography.Title>
        <Typography.Text code>{collection.slug}</Typography.Text>
      </Flex>
      <Flex align="center" gap={8} wrap>
        <CollectionStatusTag status={collection.status} />
        <Button onClick={onEdit}>Редактировать</Button>
        <CollectionStatusActions collection={collection} />
        <Button type="primary">
          <Link
            to={`/places/import/yandex?collectionId=${encodeURIComponent(collection.id)}`}
          >
            Импортировать из Яндекс Карт
          </Link>
        </Button>
      </Flex>
    </Flex>
  )
}
