import { useCreateCategoryMutation } from '@/entities/category/model/category-mutations'
import {
  toCreateCategoryRequest,
  type CategoryFormValues,
} from '@/features/category/form/model/category-form'
import { CategoryFormErrorAlert } from '@/features/category/form/ui/category-form-error-alert'
import { CategoryFormFields } from '@/features/category/form/ui/category-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import { App as AntdApp, Button, Drawer, Flex, Form } from 'antd'
import { useState } from 'react'

/**
 * Props drawer-а создания категории.
 */
export type CreateCategoryDrawerProps = {
  onClose: () => void
  onCreated?: (category: AdminPlaceCategory) => void
  open: boolean
}

/**
 * Drawer-сценарий создания категории места.
 *
 * @remarks Отправляет данные через entity-level mutation, показывает AntD notifications и защищает закрытие формы с несохраненными значениями.
 */
export function CreateCategoryDrawer({
  onClose,
  onCreated,
  open,
}: CreateCategoryDrawerProps) {
  const { message, modal } = AntdApp.useApp()
  const [form] = Form.useForm<CategoryFormValues>()
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const createCategoryMutation = useCreateCategoryMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (category) => {
      setErrorMessages([])
      setIsDirty(false)
      form.resetFields()
      void message.success('Категория создана')
      onCreated?.(category)
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
    if (createCategoryMutation.isPending) {
      return
    }

    if (!isDirty) {
      closeClean()
      return
    }

    modal.confirm({
      cancelText: 'Остаться',
      content: 'Несохраненная категория будет потеряна.',
      okText: 'Закрыть',
      onOk: closeClean,
      title: 'Закрыть без сохранения?',
    })
  }

  const handleFinish = (values: CategoryFormValues) => {
    setErrorMessages([])
    createCategoryMutation.mutate(toCreateCategoryRequest(values))
  }

  return (
    <Drawer
      destroyOnHidden
      onClose={requestClose}
      open={open}
      title="Новая категория"
      width={520}
    >
      <Form<CategoryFormValues>
        form={form}
        layout="vertical"
        name="create-category"
        onFinish={handleFinish}
        onValuesChange={() => {
          setIsDirty(true)
        }}
        requiredMark={false}
      >
        {Boolean(errorMessages.length) && (
          <Form.Item>
            <CategoryFormErrorAlert
              messages={errorMessages}
              title="Не удалось создать категорию"
            />
          </Form.Item>
        )}

        <CategoryFormFields disabled={createCategoryMutation.isPending} />

        <Flex gap={8} justify="end" wrap>
          <Button
            disabled={createCategoryMutation.isPending}
            onClick={requestClose}
          >
            Отмена
          </Button>
          <Button
            htmlType="submit"
            loading={createCategoryMutation.isPending}
            type="primary"
          >
            Создать
          </Button>
        </Flex>
      </Form>
    </Drawer>
  )
}
