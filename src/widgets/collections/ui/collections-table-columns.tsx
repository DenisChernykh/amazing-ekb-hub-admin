import {
  getCollectionDescription,
  getCollectionPlacesMeta,
} from '@/entities/collection'
import { DeleteCollectionButton } from '@/features/collection/delete/ui/delete-collection-button'
import { CollectionStatusActions } from '@/features/collection/status/ui/collection-status-actions'
import type { AdminCollectionSummaryResponseDto } from '@/shared/api'
import { Button, Flex, Typography, type TableColumnsType } from 'antd'
import { Link } from 'react-router'

/** Создаёт read/write колонки таблицы коллекций. */
export function getCollectionsTableColumns({
  onEdit,
}: {
  onEdit: (collection: AdminCollectionSummaryResponseDto) => void
}): TableColumnsType<AdminCollectionSummaryResponseDto> {
  return [
    { dataIndex: 'position', key: 'position', title: 'Порядок', width: 80 },
    {
      dataIndex: 'title',
      key: 'title',
      render: (title, collection) => (
        <Flex vertical>
          <Link to={`/collections/${collection.id}`}>
            <Typography.Text strong>{title}</Typography.Text>
          </Link>
          <Typography.Text type="secondary">
            {getCollectionDescription(collection.description)}
          </Typography.Text>
        </Flex>
      ),
      title: 'Подборка',
    },
    {
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => <Typography.Text code>{slug}</Typography.Text>,
      title: 'Ярлык',
    },
    {
      dataIndex: 'activePlaceCount',
      key: 'places',
      render: (_value, collection) => getCollectionPlacesMeta(collection),
      title: 'Места',
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (_value, collection) => (
        <CollectionStatusActions collection={collection} />
      ),
      title: 'Статус',
    },
    {
      key: 'actions',
      render: (_value, collection) => (
        <Flex gap={8} wrap>
          <Button onClick={() => onEdit(collection)} size="small">
            Редактировать
          </Button>
          <DeleteCollectionButton collection={collection} />
        </Flex>
      ),
      title: 'Действия',
    },
  ]
}
