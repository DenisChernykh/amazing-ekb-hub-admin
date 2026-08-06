import { usePlacesListQuery } from '@/entities/place/model/place-hooks'
import { AddCollectionPlaceAction } from '@/features/collection/membership/ui/add-collection-place-action'
import type { AdminCollectionDetailResponseDto } from '@/shared/api'
import { Flex, Pagination, Select, Space } from 'antd'
import { useState } from 'react'

/** Server-paginated picker row with explicit add action for durable membership. */
export function CollectionPlacePickerWithAction({
  collection,
  onAdded,
}: {
  collection: AdminCollectionDetailResponseDto
  onAdded?: () => void
}) {
  const [placeId, setPlaceId] = useState<string>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50
  const normalizedSearch = search.trim()
  const placesQuery = usePlacesListQuery({
    page,
    pageSize,
    ...(normalizedSearch ? { search: normalizedSearch } : {}),
  })
  const memberIds = new Set(collection.places.map(({ place }) => place.id))
  const options = (placesQuery.data?.items ?? [])
    .filter(({ id }) => !memberIds.has(id))
    .map((place) => ({
      label: `${place.title} (${place.status === 'active' ? 'активно' : 'скрыто'})`,
      value: place.id,
    }))
  return (
    <Flex gap={8} vertical>
      <Space.Compact block>
        <Select
          showSearch
          filterOption={false}
          loading={placesQuery.isFetching}
          onChange={setPlaceId}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          options={options}
          placeholder="Найти место по названию"
          value={placeId}
        />
        <AddCollectionPlaceAction
          collectionId={collection.id}
          onAdded={() => {
            setPlaceId(undefined)
            onAdded?.()
          }}
          placeId={placeId}
        />
      </Space.Compact>
      {(placesQuery.data?.total ?? 0) > pageSize && (
        <Pagination
          current={page}
          onChange={setPage}
          pageSize={pageSize}
          showSizeChanger={false}
          total={placesQuery.data?.total ?? 0}
        />
      )}
    </Flex>
  )
}
