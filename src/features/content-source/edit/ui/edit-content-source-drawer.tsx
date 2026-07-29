import { useUpdateContentSourceMutation } from '@/entities/content-source/model/content-source-mutations'
import {
  getContentSourceFormChangedFields,
  getContentSourceFormInitialValues,
  toUpdateContentSourceRequest,
  type ContentSourceFormValues,
} from '@/features/content-source/form/model/content-source-form'
import { editContentSourceFormSchema } from '@/features/content-source/form/model/content-source-form-schema'
import { ContentSourceFormChangedFields } from '@/features/content-source/form/ui/content-source-form-changed-fields'
import { ContentSourceFormErrorAlert } from '@/features/content-source/form/ui/content-source-form-error-alert'
import { ContentSourceFormFields } from '@/features/content-source/form/ui/content-source-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { ContentSource } from '@/shared/api/generated/model'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { App as AntdApp, Drawer, Form } from 'antd'
import { FormProvider, useWatch } from 'react-hook-form'
import { useState } from 'react'
import { EditContentSourceDrawerActions } from './edit-content-source-drawer-actions'

/**
 * Props drawer-а редактирования content source.
 */
export type EditContentSourceDrawerProps = {
  contentSource: ContentSource
  onClose: () => void
  onUpdated?: (contentSource: ContentSource) => void
  open: boolean
}

/**
 * Drawer-сценарий редактирования content source с dirty diff chips.
 *
 * @remarks Platform остается read-only: backend update endpoint не меняет платформу source.
 */
export function EditContentSourceDrawer({
  contentSource,
  onClose,
  onUpdated,
  open,
}: EditContentSourceDrawerProps) {
  const { message, modal } = AntdApp.useApp()
  const initialValues = getContentSourceFormInitialValues(contentSource)
  const form = useZodForm(editContentSourceFormSchema, {
    defaultValues: initialValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const values = useWatch({
    compute: (currentValues) => currentValues,
    control: form.control,
  })
  const changedFields = getContentSourceFormChangedFields(values, initialValues)
  const isDirty = changedFields.length > 0
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const updateSourceMutation = useUpdateContentSourceMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (updatedSource) => {
      setErrorMessages([])
      form.reset(initialValues)
      void message.success('Источник обновлен')
      onUpdated?.(updatedSource)
      onClose()
    },
  })

  const closeClean = () => {
    setErrorMessages([])
    form.reset(initialValues)
    onClose()
  }

  const requestClose = () => {
    if (updateSourceMutation.isPending) {
      return
    }

    if (!isDirty) {
      closeClean()
      return
    }

    modal.confirm({
      cancelText: 'Остаться',
      content: 'Несохраненные изменения источника будут потеряны.',
      okText: 'Закрыть',
      onOk: closeClean,
      title: 'Закрыть без сохранения?',
    })
  }

  const handleSubmit = (formValues: ContentSourceFormValues) => {
    const data = toUpdateContentSourceRequest(formValues, initialValues)

    if (!Object.keys(data).length) {
      return
    }

    setErrorMessages([])
    updateSourceMutation.mutate({
      data,
      sourceId: contentSource.id,
    })
  }

  return (
    <Drawer
      destroyOnHidden
      onClose={requestClose}
      open={open}
      title="Редактирование источника"
      width={520}
    >
      <FormProvider {...form}>
        <form
          name="edit-content-source"
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {Boolean(errorMessages.length) && (
            <Form.Item layout="vertical">
              <ContentSourceFormErrorAlert
                messages={errorMessages}
                title="Не удалось обновить источник"
              />
            </Form.Item>
          )}

          {Boolean(changedFields.length) && (
            <Form.Item layout="vertical">
              <ContentSourceFormChangedFields fields={changedFields} />
            </Form.Item>
          )}

          <ContentSourceFormFields
            control={form.control}
            disabled={updateSourceMutation.isPending}
            platformDisabled
          />

          <EditContentSourceDrawerActions
            isDirty={isDirty}
            isPending={updateSourceMutation.isPending}
            onCancel={requestClose}
          />
        </form>
      </FormProvider>
    </Drawer>
  )
}
