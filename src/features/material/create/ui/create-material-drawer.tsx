import { useCreatePlaceMaterialMutation } from '@/entities/material/model/material-mutations'
import {
  toCreateMaterialRequest,
  type MaterialFormValues,
} from '@/features/material/form/model/material-form'
import { MaterialFormErrorAlert } from '@/features/material/form/ui/material-form-error-alert'
import { MaterialFormFields } from '@/features/material/form/ui/material-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { Material } from '@/shared/api/generated/model'
import { App as AntdApp, Button, Drawer, Flex, Form } from 'antd'
import { useState } from 'react'

/**
 * Props drawer-а создания материала.
 */
export type CreateMaterialDrawerProps = {
  onClose: () => void
  onCreated?: (material: Material) => void
  open: boolean
  placeId: string
}

/**
 * Drawer-сценарий создания материала места.
 *
 * @remarks Отправляет данные через entity-level mutation, показывает AntD
 * notifications и защищает закрытие формы с несохраненными значениями.
 */
export function CreateMaterialDrawer({
  onClose,
  onCreated,
  open,
  placeId,
}: CreateMaterialDrawerProps) {
  const { message, modal } = AntdApp.useApp()
  const [form] = Form.useForm<MaterialFormValues>()
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const createMaterialMutation = useCreatePlaceMaterialMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (material) => {
      setErrorMessages([])
      setIsDirty(false)
      form.resetFields()
      void message.success('Материал добавлен')
      onCreated?.(material)
      onClose()
    },
  })

  const closeClean = () => {
    setErrorMessages([])
    setIsDirty(false)
    form.resetFields()
    onClose()
  }

  const requestClose = () => {
    if (createMaterialMutation.isPending) {
      return
    }

    if (!isDirty) {
      closeClean()
      return
    }

    modal.confirm({
      cancelText: 'Остаться',
      content: 'Несохраненный материал будет потерян.',
      okText: 'Закрыть',
      onOk: closeClean,
      title: 'Закрыть без сохранения?',
    })
  }

  const handleFinish = (values: MaterialFormValues) => {
    setErrorMessages([])
    createMaterialMutation.mutate({
      data: toCreateMaterialRequest(values),
      pathParams: { placeId },
    })
  }

  return (
    <Drawer
      destroyOnHidden
      onClose={requestClose}
      open={open}
      title="Новый материал"
      width={520}
    >
      <Form<MaterialFormValues>
        form={form}
        layout="vertical"
        name="create-material"
        onFinish={handleFinish}
        onValuesChange={() => {
          setIsDirty(true)
        }}
        requiredMark={false}
      >
        {Boolean(errorMessages.length) && (
          <Form.Item>
            <MaterialFormErrorAlert
              messages={errorMessages}
              title="Не удалось добавить материал"
            />
          </Form.Item>
        )}

        <MaterialFormFields disabled={createMaterialMutation.isPending} />

        <Flex gap={8} justify="end" wrap>
          <Button
            disabled={createMaterialMutation.isPending}
            onClick={requestClose}
          >
            Отмена
          </Button>
          <Button
            htmlType="submit"
            loading={createMaterialMutation.isPending}
            type="primary"
          >
            Добавить
          </Button>
        </Flex>
      </Form>
    </Drawer>
  )
}
