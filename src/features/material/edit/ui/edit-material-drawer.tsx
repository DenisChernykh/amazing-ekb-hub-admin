import { useUpdateMaterialMutation } from '@/entities/material/model/material-mutations'
import {
  getMaterialFormChangedFields,
  getMaterialFormInitialValues,
  hasMaterialFormChanges,
  toUpdateMaterialRequest,
  type EditableMaterial,
  type MaterialFormValues,
} from '@/features/material/form/model/material-form'
import {
  editMaterialWithoutUrlFormSchema,
  editMaterialWithUrlFormSchema,
} from '@/features/material/form/model/material-form-schema'
import { MaterialFormChangedFields } from '@/features/material/form/ui/material-form-changed-fields'
import { MaterialFormErrorAlert } from '@/features/material/form/ui/material-form-error-alert'
import { MaterialFormFields } from '@/features/material/form/ui/material-form-fields'
import type { MaterialResponseDto } from '@/shared/api'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { App as AntdApp, Drawer, Form } from 'antd'
import { useState } from 'react'
import { FormProvider, useWatch } from 'react-hook-form'
import { EditMaterialDrawerActions } from './edit-material-drawer-actions'

/**
 * Props drawer-а редактирования материала.
 */
export type EditMaterialDrawerProps = {
  material: EditableMaterial
  onClose: () => void
  onUpdated?: (material: MaterialResponseDto) => void
  open: boolean
  placeId: string
}

/**
 * Drawer-сценарий редактирования материала с dirty diff chips.
 *
 * @remarks Отправляет только измененные поля, блокирует сохранение без diff и
 * защищает закрытие drawer-а с несохраненными изменениями.
 */
export function EditMaterialDrawer({
  material,
  onClose,
  onUpdated,
  open,
  placeId,
}: EditMaterialDrawerProps) {
  const { message, modal } = AntdApp.useApp()
  const initialValues = getMaterialFormInitialValues(material)
  const showUrlField = typeof material.url === 'string'
  const schema = showUrlField
    ? editMaterialWithUrlFormSchema
    : editMaterialWithoutUrlFormSchema
  const form = useZodForm(schema, {
    defaultValues: initialValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  useWatch({ control: form.control })
  const values = form.getValues()
  const isDirty = hasMaterialFormChanges(values, initialValues)
  const changedFields = getMaterialFormChangedFields(values, initialValues)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const updateMaterialMutation = useUpdateMaterialMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (updatedMaterial) => {
      setErrorMessages([])
      void message.success('Материал обновлен')
      onUpdated?.(updatedMaterial)
      onClose()
    },
  })

  const closeClean = () => {
    setErrorMessages([])
    form.reset()
    onClose()
  }

  const requestClose = () => {
    if (updateMaterialMutation.isPending) {
      return
    }

    if (!isDirty) {
      closeClean()
      return
    }

    modal.confirm({
      cancelText: 'Остаться',
      content: 'Несохраненные изменения материала будут потеряны.',
      okText: 'Закрыть',
      onOk: closeClean,
      title: 'Закрыть без сохранения?',
    })
  }

  const handleSubmit = (values: MaterialFormValues) => {
    const data = toUpdateMaterialRequest(values, initialValues)

    if (!Object.keys(data).length) {
      return
    }

    setErrorMessages([])
    updateMaterialMutation.mutate({
      data,
      materialId: material.id,
      placeId,
    })
  }

  return (
    <Drawer
      destroyOnHidden
      onClose={requestClose}
      open={open}
      title="Редактирование материала"
      width={520}
    >
      <FormProvider {...form}>
        <form
          name="edit-material"
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {Boolean(errorMessages.length) && (
            <Form.Item layout="vertical">
              <MaterialFormErrorAlert
                messages={errorMessages}
                title="Не удалось обновить материал"
              />
            </Form.Item>
          )}

          {Boolean(changedFields.length) && (
            <Form.Item layout="vertical">
              <MaterialFormChangedFields fields={changedFields} />
            </Form.Item>
          )}

          <MaterialFormFields
            control={form.control}
            disabled={updateMaterialMutation.isPending}
            showUrlField={showUrlField}
          />

          <EditMaterialDrawerActions
            isDirty={isDirty}
            isPending={updateMaterialMutation.isPending}
            onCancel={requestClose}
          />
        </form>
      </FormProvider>
    </Drawer>
  )
}
