import { useReorderCollectionPlacesMutation } from '@/entities/collection'
import type { AdminCollectionPlaceResponseDto } from '@/shared/api'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  HolderOutlined,
} from '@ant-design/icons'
import { Button, Flex, message } from 'antd'
import { useRef, useState } from 'react'

/** Перемещает item и сохраняет exact order в collection endpoint. */
export function CollectionPlaceOrderActions({
  collectionId,
  places,
}: {
  collectionId: string
  places: AdminCollectionPlaceResponseDto[]
}) {
  const [draft, setDraft] = useState(places)
  const confirmed = useRef(places)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= draft.length) return
    const next = [...draft]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setDraft(next)
    mutation.mutate({
      collectionId,
      placeIds: next.map(({ place }) => place.id),
    })
  }
  const mutation = useReorderCollectionPlacesMutation({
    onError: () => {
      setDraft(confirmed.current)
      void message.error('Не удалось сохранить порядок мест.')
    },
    onSuccess: () => {
      confirmed.current = draft
    },
  })
  return (
    <Flex vertical>
      {draft.map((entry, index) => (
        <Flex
          align="center"
          gap={8}
          key={entry.place.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (!draggedId) return
            const from = draft.findIndex(({ place }) => place.id === draggedId)
            move(from, index)
            setDraggedId(null)
          }}
        >
          <Button
            aria-label={`Перетащить ${entry.place.title}`}
            disabled={mutation.isPending}
            draggable
            icon={<HolderOutlined aria-hidden="true" />}
            onDragStart={() => setDraggedId(entry.place.id)}
            size="small"
          />
          <span>{entry.place.title}</span>
          <Button
            aria-label={`Переместить ${entry.place.title} выше`}
            disabled={mutation.isPending || index === 0}
            icon={<ArrowUpOutlined aria-hidden="true" />}
            onClick={() => move(index, index - 1)}
            size="small"
          />
          <Button
            aria-label={`Переместить ${entry.place.title} ниже`}
            disabled={mutation.isPending || index === draft.length - 1}
            icon={<ArrowDownOutlined aria-hidden="true" />}
            onClick={() => move(index, index + 1)}
            size="small"
          />
        </Flex>
      ))}
    </Flex>
  )
}
