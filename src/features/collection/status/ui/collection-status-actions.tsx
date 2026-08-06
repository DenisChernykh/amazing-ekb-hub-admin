import { useUpdateCollectionStatusMutation } from '@/entities/collection'
import { CollectionStatusTag } from '@/entities/collection/ui/collection-status-tag'
import { getCollectionStatusError } from '@/features/collection/model/collection-errors'
import type { AdminCollectionSummaryResponseDto } from '@/shared/api'
import { App as AntdApp, Button, Flex } from 'antd'
import { useState } from 'react'

/** Переключает draft/active с безопасными backend problem messages. */
export function CollectionStatusActions({
  collection,
}: {
  collection: AdminCollectionSummaryResponseDto
}) {
  const { message } = AntdApp.useApp()
  const [error, setError] = useState<string | null>(null)
  const mutation = useUpdateCollectionStatusMutation({
    onError: (apiError) => {
      const value = getCollectionStatusError(apiError)
      setError(value)
      void message.error(value)
    },
    onSuccess: () => {
      setError(null)
      void message.success('Статус подборки изменён')
    },
  })
  const nextStatus = collection.status === 'active' ? 'draft' : 'active'
  return (
    <Flex align="center" gap={8} wrap>
      <CollectionStatusTag status={collection.status} />
      <Button
        disabled={mutation.isPending}
        loading={mutation.isPending}
        onClick={() =>
          mutation.mutate({
            collectionId: collection.id,
            data: { status: nextStatus },
          })
        }
        size="small"
      >
        {nextStatus === 'active' ? 'Опубликовать' : 'Снять с публикации'}
      </Button>
      {error && <span>{error}</span>}
    </Flex>
  )
}
