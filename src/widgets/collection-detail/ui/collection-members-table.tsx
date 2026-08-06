import { PlaceStatusTag } from '@/entities/place/ui/place-status-tag'
import { RemoveCollectionPlaceAction } from '@/features/collection/membership/ui/remove-collection-place-action'
import { CollectionPlaceOrderActions } from '@/features/collection/reorder/ui/collection-place-order-actions'
import type { AdminCollectionDetailResponseDto } from '@/shared/api'
import { Table, Typography } from 'antd'
import { Link } from 'react-router'
import styles from './collection-detail.module.css'

/** Таблица membership с active/hidden rows и row-local unlink. */
export function CollectionMembersTable({
  collection,
  addedPlaceId,
}: {
  collection: AdminCollectionDetailResponseDto
  addedPlaceId?: string | null
}) {
  return (
    <Table
      dataSource={collection.places}
      pagination={false}
      rowClassName={(entry) =>
        entry.place.id === addedPlaceId ? styles.highlight : ''
      }
      rowKey={({ place }) => place.id}
      columns={[
        {
          dataIndex: ['place', 'title'],
          key: 'title',
          render: (_value, entry) => (
            <Link to={`/places/${entry.place.id}`}>{entry.place.title}</Link>
          ),
          title: 'Место',
        },
        {
          dataIndex: ['place', 'status'],
          key: 'status',
          render: (_value, entry) => (
            <PlaceStatusTag status={entry.place.status} />
          ),
          title: 'Статус',
        },
        { dataIndex: 'position', key: 'position', title: 'Позиция' },
        {
          key: 'actions',
          render: (_value, entry) => (
            <RemoveCollectionPlaceAction
              collectionId={collection.id}
              placeId={entry.place.id}
            />
          ),
          title: 'Действия',
        },
      ]}
    />
  )
}

/** Компактный keyboard/mouse order control под таблицей membership. */
export function CollectionMembersOrder({
  collection,
}: {
  collection: AdminCollectionDetailResponseDto
}) {
  return (
    <>
      <Typography.Title level={5}>Порядок мест</Typography.Title>
      <CollectionPlaceOrderActions
        collectionId={collection.id}
        key={
          collection.places
            .map(({ place, position }) => `${place.id}:${position}`)
            .join('|') || 'empty'
        }
        places={collection.places}
      />
    </>
  )
}
