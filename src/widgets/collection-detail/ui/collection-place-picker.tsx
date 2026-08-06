import { usePlacesListQuery } from '@/entities/place/model/place-hooks'
import { AddCollectionPlaceAction } from '@/features/collection/membership/ui/add-collection-place-action'
import type { AdminCollectionDetailResponseDto } from '@/shared/api'
import { Select, Space, Tag } from 'antd'
import { useState } from 'react'

/** Paginated server-search picker for active and hidden Places. */
export function CollectionPlacePicker({
  collection,
  onAdded,
}: {
  collection: AdminCollectionDetailResponseDto
  onAdded?: () => void
}) {
  const [search, setSearch] = useState('')
  const placesQuery = usePlacesListQuery({
    page: 1,
    pageSize: 50,
    ...(search.trim() ? { search: search.trim() } : {}),
  })
  const memberIds = new Set(collection.places.map(({ place }) => place.id))
  const options = (placesQuery.data?.items ?? [])
    .filter(({ id }) => !memberIds.has(id))
    .map((place) => ({
      label: (
        <Space>
          <span>{place.title}</span>
          <Tag>{place.status === 'active' ? 'Активно' : 'Скрыто'}</Tag>
        </Space>
      ),
      value: place.id,
    }))
  return (
    <Select
      showSearch
      filterOption={false}
      loading={placesQuery.isFetching}
      onSearch={setSearch}
      options={options}
      placeholder="Найти место по названию"
      value={undefined}
      onSelect={() => {
        onAdded?.()
      }}
    />
  )
}

/** Simple picker row with explicit add action for durable membership. */
export function CollectionPlacePickerWithAction({
  collection,
  onAdded,
}: {
  collection: AdminCollectionDetailResponseDto
  onAdded?: () => void
}) {
  const [placeId, setPlaceId] = useState<string>()
  const [search, setSearch] = useState('')
  const placesQuery = usePlacesListQuery({
    page: 1,
    pageSize: 50,
    ...(search.trim() ? { search: search.trim() } : {}),
  })
  const memberIds = new Set(collection.places.map(({ place }) => place.id))
  const options = (placesQuery.data?.items ?? [])
    .filter(({ id }) => !memberIds.has(id))
    .map((place) => ({
      label: `${place.title} (${place.status === 'active' ? 'активно' : 'скрыто'})`,
      value: place.id,
    }))
  return (
    <Space.Compact block>
      <Select
        showSearch
        filterOption={false}
        loading={placesQuery.isFetching}
        onChange={setPlaceId}
        onSearch={setSearch}
        options={options}
        placeholder="Найти место по названию"
        value={placeId}
      />
      <AddCollectionPlaceAction
        collectionId={collection.id}
        onAdded={onAdded}
        placeId={placeId ?? ''}
      />
    </Space.Compact>
  )
}
