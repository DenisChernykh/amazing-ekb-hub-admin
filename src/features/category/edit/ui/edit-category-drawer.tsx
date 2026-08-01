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
import { getEditCategoryError } from '@/features/category/model/category-errors'
import type { PlaceCategoryResponseDto } from '@/shared/api'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { App as AntdApp, Drawer, Form } from 'antd'
import { useState } from 'react'
import { FormProvider, useWatch } from 'react-hook-form'
import { EditCategoryDrawerActions } from './edit-category-drawer-actions'

/**
 * Props drawer-а редактирования категории.
 */
export type EditCategoryDrawerProps = {
  category: PlaceCategoryResponseDto
  onClose: () => void
  onUpdated?: (category: PlaceCategoryResponseDto) => void
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
      const errorMessage = getEditCategoryError(error)
      setErrorMessages([errorMessage])
      void message.error(errorMessage)
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
            <Form.Item layout="vertical">
              <CategoryFormErrorAlert
                messages={errorMessages}
                title="Не удалось обновить категорию"
              />
            </Form.Item>
          )}

          {Boolean(changedFields.length) && (
            <Form.Item layout="vertical">
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
