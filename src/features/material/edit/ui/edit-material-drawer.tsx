import { useUpdateMaterialMutation } from '@/entities/material/model/material-mutations'
import {
  getMaterialFormChangedFields,
  getMaterialFormInitialValues,
  hasMaterialFormChanges,
  toUpdateMaterialRequest,
  type EditableMaterial,
  type MaterialFormChangedField,
  type MaterialFormValues,
} from '@/features/material/form/model/material-form'
import { MaterialFormChangedFields } from '@/features/material/form/ui/material-form-changed-fields'
import { MaterialFormErrorAlert } from '@/features/material/form/ui/material-form-error-alert'
import { MaterialFormFields } from '@/features/material/form/ui/material-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { Material } from '@/shared/api/generated/model'
import { App as AntdApp, Drawer, Form } from 'antd'
import { useState } from 'react'
import { EditMaterialDrawerActions } from './edit-material-drawer-actions'

/**
 * Props drawer-а редактирования материала.
 */
export type EditMaterialDrawerProps = {
  material: EditableMaterial
  onClose: () => void
  onUpdated?: (material: Material) => void
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
  const [form] = Form.useForm<MaterialFormValues>()
  const initialValues = getMaterialFormInitialValues(material)
  const showUrlField = typeof material.url === 'string'
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [changedFields, setChangedFields] = useState<
    MaterialFormChangedField[]
  >([])
  const updateMaterialMutation = useUpdateMaterialMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (updatedMaterial) => {
      setErrorMessages([])
      setIsDirty(false)
      setChangedFields([])
      void message.success('Материал обновлен')
      onUpdated?.(updatedMaterial)
      onClose()
    },
  })

  const updateDirtyState = () => {
    const values = form.getFieldsValue()
    setIsDirty(hasMaterialFormChanges(values, initialValues))
    setChangedFields(getMaterialFormChangedFields(values, initialValues))
  }

  const closeClean = () => {
    setErrorMessages([])
    setIsDirty(false)
    setChangedFields([])
    form.resetFields()
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

  const handleFinish = (values: MaterialFormValues) => {
    const data = toUpdateMaterialRequest(values, initialValues)

    if (!Object.keys(data).length) {
      setIsDirty(false)
      setChangedFields([])
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
      <Form<MaterialFormValues>
        form={form}
        initialValues={initialValues}
        layout="vertical"
        name="edit-material"
        onFinish={handleFinish}
        onValuesChange={updateDirtyState}
        requiredMark={false}
      >
        {Boolean(errorMessages.length) && (
          <Form.Item>
            <MaterialFormErrorAlert
              messages={errorMessages}
              title="Не удалось обновить материал"
            />
          </Form.Item>
        )}

        {Boolean(changedFields.length) && (
          <Form.Item>
            <MaterialFormChangedFields fields={changedFields} />
          </Form.Item>
        )}

        <MaterialFormFields
          disabled={updateMaterialMutation.isPending}
          showUrlField={showUrlField}
        />

        <EditMaterialDrawerActions
          isDirty={isDirty}
          isPending={updateMaterialMutation.isPending}
          onCancel={requestClose}
        />
      </Form>
    </Drawer>
  )
}
