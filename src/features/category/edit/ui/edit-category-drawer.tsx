import { useUpdateCategoryMutation } from '@/entities/category/model/category-mutations'
import {
  getCategoryFormChangedFields,
  getCategoryFormInitialValues,
  hasCategoryFormChanges,
  toUpdateCategoryRequest,
  type CategoryFormChangedField,
  type CategoryFormValues,
} from '@/features/category/form/model/category-form'
import { CategoryFormChangedFields } from '@/features/category/form/ui/category-form-changed-fields'
import { CategoryFormErrorAlert } from '@/features/category/form/ui/category-form-error-alert'
import { CategoryFormFields } from '@/features/category/form/ui/category-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import { App as AntdApp, Drawer, Form } from 'antd'
import { useState } from 'react'
import { EditCategoryDrawerActions } from './edit-category-drawer-actions'

/**
 * Props drawer-а редактирования категории.
 */
export type EditCategoryDrawerProps = {
  category: AdminPlaceCategory
  onClose: () => void
  onUpdated?: (category: AdminPlaceCategory) => void
  open: boolean
}

/**
 * Drawer-сценарий редактирования категории места с dirty diff chips.
 *
 * @remarks Использует entity-level mutation и закрывает drawer только после успешного backend update.
 */
export function EditCategoryDrawer({
  category,
  onClose,
  onUpdated,
  open,
}: EditCategoryDrawerProps) {
  const { message, modal } = AntdApp.useApp()
  const [form] = Form.useForm<CategoryFormValues>()
  const initialValues = getCategoryFormInitialValues(category)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [changedFields, setChangedFields] = useState<
    CategoryFormChangedField[]
  >([])
  const updateCategoryMutation = useUpdateCategoryMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (updatedCategory) => {
      setErrorMessages([])
      setIsDirty(false)
      setChangedFields([])
      void message.success('Категория обновлена')
      onUpdated?.(updatedCategory)
      onClose()
    },
  })

  const updateDirtyState = () => {
    const values = form.getFieldsValue()
    setIsDirty(hasCategoryFormChanges(values, initialValues))
    setChangedFields(getCategoryFormChangedFields(values, initialValues))
  }

  const closeClean = () => {
    setErrorMessages([])
    setIsDirty(false)
    setChangedFields([])
    form.resetFields()
    onClose()
  }

  const requestClose = () => {
    if (updateCategoryMutation.isPending) {
      return
    }

    if (!isDirty) {
      closeClean()
      return
    }

    modal.confirm({
      cancelText: 'Остаться',
      content: 'Несохраненные изменения категории будут потеряны.',
      okText: 'Закрыть',
      onOk: closeClean,
      title: 'Закрыть без сохранения?',
    })
  }

  const handleFinish = (values: CategoryFormValues) => {
    const data = toUpdateCategoryRequest(values, initialValues)

    if (!Object.keys(data).length) {
      setIsDirty(false)
      setChangedFields([])
      return
    }

    setErrorMessages([])
    updateCategoryMutation.mutate({
      categoryId: category.id,
      data,
    })
  }

  return (
    <Drawer
      destroyOnHidden
      onClose={requestClose}
      open={open}
      title="Редактирование категории"
      width={520}
    >
      <Form<CategoryFormValues>
        form={form}
        initialValues={initialValues}
        layout="vertical"
        name="edit-category"
        onFinish={handleFinish}
        onValuesChange={updateDirtyState}
        requiredMark={false}
      >
        {Boolean(errorMessages.length) && (
          <Form.Item>
            <CategoryFormErrorAlert
              messages={errorMessages}
              title="Не удалось обновить категорию"
            />
          </Form.Item>
        )}

        {Boolean(changedFields.length) && (
          <Form.Item>
            <CategoryFormChangedFields fields={changedFields} />
          </Form.Item>
        )}

        <CategoryFormFields
          disabled={updateCategoryMutation.isPending}
          slugRequired
        />

        <EditCategoryDrawerActions
          isDirty={isDirty}
          isPending={updateCategoryMutation.isPending}
          onCancel={requestClose}
        />
      </Form>
    </Drawer>
  )
}
