import { useReplacePlaceCollectionsMutation } from '@/entities/place/model/place-mutations'
import {
  areCollectionIdsEqual,
  getPlaceCollectionIds,
} from '@/features/place/collections/model/place-collections-assignment'
import type {
  AdminCollectionSummaryResponseDto,
  AdminPlaceSummaryResponseDto,
} from '@/shared/api'
import { Button, Flex, Select, Typography } from 'antd'
import { useState } from 'react'

/** Inline full-set collection assignment with explicit Save and rollback. */
export function PlaceCollectionsAssignment({
  collections,
  place,
}: {
  collections: AdminCollectionSummaryResponseDto[]
  place: AdminPlaceSummaryResponseDto
}) {
  const serverIds = getPlaceCollectionIds(place)
  const [draftIds, setDraftIds] = useState(serverIds)
  const [savedIds, setSavedIds] = useState(serverIds)
  const [error, setError] = useState<string | null>(null)
  const mutation = useReplacePlaceCollectionsMutation({
    onError: (apiError) => {
      setDraftIds(savedIds)
      setError(
        apiError instanceof Error
          ? apiError.message
          : 'Не удалось сохранить подборки.',
      )
    },
    onSuccess: () => {
      setSavedIds(draftIds)
      setError(null)
    },
  })
  const dirty = !areCollectionIdsEqual(draftIds, savedIds)
  return (
    <Flex gap={4} vertical>
      <Select
        aria-label={`Подборки для ${place.title}`}
        disabled={mutation.isPending}
        mode="multiple"
        onChange={setDraftIds}
        options={collections
          .filter(({ status }) => status === 'draft' || status === 'active')
          .map(({ id, title, status }) => ({
            label: `${title} (${status === 'active' ? 'активная' : 'черновик'})`,
            value: id,
          }))}
        value={draftIds}
      />
      <Button
        disabled={!dirty || mutation.isPending}
        loading={mutation.isPending}
        onClick={() =>
          mutation.mutate({
            data: { collectionIds: draftIds },
            pathParams: { placeId: place.id },
            previousCollectionIds: savedIds,
          })
        }
        size="small"
      >
        Сохранить
      </Button>
      {error && <Typography.Text type="danger">{error}</Typography.Text>}
    </Flex>
  )
}
