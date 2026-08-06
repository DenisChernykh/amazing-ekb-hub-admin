import { useDeleteCollectionMutation } from '@/entities/collection'
import { getCollectionDeleteError } from '@/features/collection/model/collection-errors'
import type { AdminCollectionSummaryResponseDto } from '@/shared/api'
import { App as AntdApp, Button, Popconfirm } from 'antd'
import { useState } from 'react'

/** Удаляет draft-подборку с показом conflict ошибки. */
export function DeleteCollectionButton({
  collection,
  onDeleted,
}: {
  collection: AdminCollectionSummaryResponseDto
  onDeleted?: () => void
}) {
  const { message } = AntdApp.useApp()
  const [error, setError] = useState<string | null>(null)
  const mutation = useDeleteCollectionMutation({
    onError: (apiError) => {
      const value = getCollectionDeleteError(apiError)
      setError(value)
      void message.error(value)
    },
    onSuccess: () => {
      setError(null)
      void message.success('Подборка удалена')
      onDeleted?.()
    },
  })
  return (
    <Popconfirm
      cancelText="Отмена"
      description={error ?? 'Удалить подборку?'}
      okButtonProps={{ danger: true, loading: mutation.isPending }}
      okText="Удалить"
      onConfirm={() => mutation.mutate({ collectionId: collection.id })}
      title="Удалить подборку?"
    >
      <Button danger disabled={mutation.isPending} size="small">
        Удалить
      </Button>
    </Popconfirm>
  )
}
