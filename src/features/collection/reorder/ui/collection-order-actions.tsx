import { useReorderCollectionsMutation } from '@/entities/collection'
import { moveCollection } from '@/features/collection/reorder/model/collection-order'
import type { AdminCollectionSummaryResponseDto } from '@/shared/api'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  HolderOutlined,
} from '@ant-design/icons'
import { Button, Flex, message } from 'antd'
import { useRef, useState } from 'react'

/** Props глобального reorder сценария. */
export type CollectionOrderActionsProps = {
  collections: AdminCollectionSummaryResponseDto[]
  onOrderConfirmed: (items: AdminCollectionSummaryResponseDto[]) => void
}

/** Mouse/keyboard reorder с pending-lock и rollback до confirmed server order. */
export function CollectionOrderActions({
  collections,
  onOrderConfirmed,
}: CollectionOrderActionsProps) {
  const initialOrder = collections.map(({ id }) => id)
  const [draftIds, setDraftIds] = useState(initialOrder)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const confirmed = useRef(initialOrder)
  const submitted = useRef(initialOrder)
  const collectionById = new Map(
    collections.map((collection) => [collection.id, collection]),
  )
  const draft = draftIds.flatMap((collectionId) => {
    const collection = collectionById.get(collectionId)
    return collection ? [collection] : []
  })
  const mutation = useReorderCollectionsMutation({
    onError: (error) => {
      setDraftIds(confirmed.current)
      void message.error(getCollectionOrderError(error))
    },
    onSuccess: () => {
      confirmed.current = submitted.current
      setDraftIds(submitted.current)
      onOrderConfirmed(
        submitted.current.flatMap((collectionId) => {
          const collection = collectionById.get(collectionId)
          return collection ? [collection] : []
        }),
      )
    },
  })
  const persist = (next: string[]) => {
    if (mutation.isPending) return
    submitted.current = next
    setDraftIds(next)
    mutation.mutate({ collectionIds: next })
  }
  return (
    <Flex vertical>
      {draft.map((collection, index) => (
        <Flex
          align="center"
          gap={8}
          key={collection.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (!draggedId) return
            const from = draftIds.findIndex((id) => id === draggedId)
            persist(moveCollection(draftIds, from, index))
            setDraggedId(null)
          }}
        >
          <Button
            aria-label={`Перетащить ${collection.title}`}
            disabled={mutation.isPending}
            draggable
            icon={<HolderOutlined aria-hidden="true" />}
            onDragStart={() => setDraggedId(collection.id)}
            size="small"
          />
          <span>{collection.title}</span>
          <Button
            aria-label={`Переместить ${collection.title} выше`}
            disabled={mutation.isPending || index === 0}
            icon={<ArrowUpOutlined aria-hidden="true" />}
            onClick={() => persist(moveCollection(draftIds, index, index - 1))}
            size="small"
          />
          <Button
            aria-label={`Переместить ${collection.title} ниже`}
            disabled={mutation.isPending || index === draft.length - 1}
            icon={<ArrowDownOutlined aria-hidden="true" />}
            onClick={() => persist(moveCollection(draftIds, index, index + 1))}
            size="small"
          />
        </Flex>
      ))}
    </Flex>
  )
}

function getCollectionOrderError(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Не удалось сохранить порядок подборок.'
}
