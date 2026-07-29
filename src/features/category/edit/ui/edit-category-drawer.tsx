import { useUpdateCategoryMutation } from '@/entities/category/model/category-mutations'
import {
  getCategoryFormChangedFields,
  getCategoryFormInitialValues,
  toUpdateCategoryRequest,
  type CategoryFormValues,
} from '@/features/category/form/model/category-form'
import { editCategoryFormSchema } from '@/features/category/form/model/category-form-schema'
import { CategoryFormChangedFields } from '@/features/category/form/ui/category-form-changed-fields'
import { CategoryFormErrorAlert } from '@/features/category/form/ui/category-form-error-alert'
import { CategoryFormFields } from '@/features/category/form/ui/category-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { App as AntdApp, Drawer, Form } from 'antd'
import { FormProvider, useWatch } from 'react-hook-form'
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
  const initialValues = getCategoryFormInitialValues(category)
  const form = useZodForm(editCategoryFormSchema, {
    defaultValues: initialValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const values = useWatch({
    compute: (currentValues) => currentValues,
    control: form.control,
  })
  const changedFields = getCategoryFormChangedFields(values, initialValues)
  const isDirty = changedFields.length > 0
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const updateCategoryMutation = useUpdateCategoryMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (updatedCategory) => {
      setErrorMessages([])
      form.reset(initialValues)
      void message.success('Категория обновлена')
      onUpdated?.(updatedCategory)
      onClose()
    },
  })

  const closeClean = () => {
    setErrorMessages([])
    form.reset(initialValues)
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

  const handleSubmit = (formValues: CategoryFormValues) => {
    const data = toUpdateCategoryRequest(formValues, initialValues)

    if (!Object.keys(data).length) {
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
      <FormProvider {...form}>
        <form
          name="edit-category"
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
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
            control={form.control}
            disabled={updateCategoryMutation.isPending}
            showSlug
          />

          <EditCategoryDrawerActions
            isDirty={isDirty}
            isPending={updateCategoryMutation.isPending}
            onCancel={requestClose}
          />
        </form>
      </FormProvider>
    </Drawer>
  )
}
