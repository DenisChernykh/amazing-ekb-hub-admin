import { useCreateCollectionMutation } from '@/entities/collection'
import {
  createCollectionFormSchema,
  toCreateCollectionRequest,
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

/** Props drawer создания подборки. */
export type CreateCollectionDrawerProps = {
  onClose: () => void
  onCreated?: (collection: AdminCollectionSummaryResponseDto) => void
  open: boolean
}

/** Создаёт draft-подборку без загрузки cover до durable create. */
export function CreateCollectionDrawer({
  onClose,
  onCreated,
  open,
}: CreateCollectionDrawerProps) {
  const { message } = AntdApp.useApp()
  const form = useZodForm(createCollectionFormSchema, {
    defaultValues: { description: '', slug: '', title: '' },
    mode: 'onChange',
  })
  const [error, setError] = useState<string | null>(null)
  const mutation = useCreateCollectionMutation({
    onError: (apiError) => setError(getCollectionFormError(apiError)),
    onSuccess: (collection) => {
      form.reset()
      setError(null)
      void message.success('Подборка создана')
      onCreated?.(collection)
      onClose()
    },
  })
  const submit = (values: CollectionFormValues) => {
    setError(null)
    mutation.mutate(toCreateCollectionRequest(values))
  }
  const requestClose = () => {
    if (mutation.isPending) return
    onClose()
  }
  return (
    <Drawer
      destroyOnHidden
      onClose={requestClose}
      open={open}
      title="Новая подборка"
      width={560}
    >
      <FormProvider {...form}>
        <form noValidate onSubmit={form.handleSubmit(submit)}>
          {error && <CollectionFormErrorAlert messages={[error]} />}
          <CollectionFormFields
            control={form.control}
            disabled={mutation.isPending}
          />
          <Flex gap={8} justify="end">
            <Button disabled={mutation.isPending} onClick={requestClose}>
              Отмена
            </Button>
            <Button
              htmlType="submit"
              loading={mutation.isPending}
              type="primary"
            >
              Создать
            </Button>
          </Flex>
        </form>
      </FormProvider>
    </Drawer>
  )
}
