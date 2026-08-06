import { useUpdateCollectionMutation } from '@/entities/collection'
import {
  editCollectionFormSchema,
  toUpdateCollectionRequest,
  type CollectionFormValues,
} from '@/features/collection/form/model/collection-form-schema'
import { CollectionFormErrorAlert } from '@/features/collection/form/ui/collection-form-error-alert'
import { CollectionFormFields } from '@/features/collection/form/ui/collection-form-fields'
import { getCollectionFormError } from '@/features/collection/model/collection-errors'
import type { AdminCollectionSummaryResponseDto } from '@/shared/api'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { App as AntdApp, Button, Drawer, Flex } from 'antd'
import { useState } from 'react'
import { FormProvider } from 'react-hook-form'

/** Props drawer редактирования коллекции. */
export type EditCollectionDrawerProps = {
  collection: AdminCollectionSummaryResponseDto | null
  onClose: () => void
}

/** Редактирует metadata коллекции через entity mutation. */
export function EditCollectionDrawer({
  collection,
  onClose,
}: EditCollectionDrawerProps) {
  return (
    <Drawer
      destroyOnHidden
      onClose={onClose}
      open={Boolean(collection)}
      title="Редактировать подборку"
      width={560}
    >
      {collection && (
        <EditCollectionForm
          collection={collection}
          key={collection.id}
          onClose={onClose}
        />
      )}
    </Drawer>
  )
}

/** Keyed form сохраняет draft при same-ID refetch и сбрасывается для новой ID. */
function EditCollectionForm({
  collection,
  onClose,
}: {
  collection: AdminCollectionSummaryResponseDto
  onClose: () => void
}) {
  const { message } = AntdApp.useApp()
  const form = useZodForm(editCollectionFormSchema, {
    defaultValues: {
      description: collection.description ?? '',
      slug: collection.slug,
      title: collection.title,
    },
    mode: 'onChange',
  })
  const [error, setError] = useState<string | null>(null)
  const mutation = useUpdateCollectionMutation({
    onError: (apiError) => setError(getCollectionFormError(apiError)),
    onSuccess: () => {
      setError(null)
      void message.success('Подборка сохранена')
      onClose()
    },
  })
  const submit = (values: CollectionFormValues) => {
    setError(null)
    mutation.mutate({
      collectionId: collection.id,
      data: toUpdateCollectionRequest(values),
    })
  }
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(submit)}>
        {error && <CollectionFormErrorAlert messages={[error]} />}
        <CollectionFormFields
          control={form.control}
          disabled={mutation.isPending}
        />
        <Flex gap={8} justify="end">
          <Button disabled={mutation.isPending} onClick={onClose}>
            Отмена
          </Button>
          <Button htmlType="submit" loading={mutation.isPending} type="primary">
            Сохранить
          </Button>
        </Flex>
      </form>
    </FormProvider>
  )
}
