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
  const [draft, setDraft] = useState(collections)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const confirmed = useRef(collections)
  const pending = useRef(collections)
  const mutation = useReorderCollectionsMutation({
    onError: (error) => {
      setDraft(confirmed.current)
      void message.error(getCollectionOrderError(error))
    },
    onSuccess: () => {
      confirmed.current = pending.current
      setDraft(pending.current)
      onOrderConfirmed(pending.current)
    },
  })
  const persist = (next: AdminCollectionSummaryResponseDto[]) => {
    pending.current = next
    setDraft(next)
    mutation.mutate({ collectionIds: next.map(({ id }) => id) })
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
            const from = draft.findIndex(({ id }) => id === draggedId)
            persist(moveCollection(draft, from, index))
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
            onClick={() => persist(moveCollection(draft, index, index - 1))}
            size="small"
          />
          <Button
            aria-label={`Переместить ${collection.title} ниже`}
            disabled={mutation.isPending || index === draft.length - 1}
            icon={<ArrowDownOutlined aria-hidden="true" />}
            onClick={() => persist(moveCollection(draft, index, index + 1))}
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
