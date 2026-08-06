import { useRemoveCollectionPlaceMutation } from '@/entities/collection'
import { getCollectionFormError } from '@/features/collection/model/collection-errors'
import { App as AntdApp, Button } from 'antd'

/** Убирает место из коллекции с row-local pending state. */
export function RemoveCollectionPlaceAction({
  collectionId,
  placeId,
}: {
  collectionId: string
  placeId: string
}) {
  const { message } = AntdApp.useApp()
  const mutation = useRemoveCollectionPlaceMutation({
    onError: (error) => void message.error(getCollectionFormError(error)),
  })
  return (
    <Button
      danger
      disabled={mutation.isPending}
      loading={mutation.isPending}
      onClick={() => mutation.mutate({ collectionId, placeId })}
      size="small"
    >
      Убрать
    </Button>
  )
}
