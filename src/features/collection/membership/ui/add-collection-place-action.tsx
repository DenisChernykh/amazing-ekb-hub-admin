import { useAddCollectionPlaceMutation } from '@/entities/collection'
import { getCollectionFormError } from '@/features/collection/model/collection-errors'
import { App as AntdApp, Button } from 'antd'

/** Добавляет место в коллекцию и не меняет его собственные поля. */
export function AddCollectionPlaceAction({
  collectionId,
  placeId,
  onAdded,
}: {
  collectionId: string
  placeId: string
  onAdded?: () => void
}) {
  const { message } = AntdApp.useApp()
  const mutation = useAddCollectionPlaceMutation({
    onError: (error) => void message.error(getCollectionFormError(error)),
    onSuccess: onAdded,
  })
  return (
    <Button
      disabled={mutation.isPending}
      loading={mutation.isPending}
      onClick={() => mutation.mutate({ collectionId, placeId })}
      size="small"
      type="primary"
    >
      Добавить
    </Button>
  )
}
