import { useCreateCategoryMutation } from '@/entities/category/model/category-mutations'
import {
  toCreateCategoryRequest,
  type CategoryFormValues,
} from '@/features/category/form/model/category-form'
import { createCategoryFormSchema } from '@/features/category/form/model/category-form-schema'
import { CategoryFormErrorAlert } from '@/features/category/form/ui/category-form-error-alert'
import { CategoryFormFields } from '@/features/category/form/ui/category-form-fields'
import type { PlaceCategoryResponseDto } from '@/shared/api'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { App as AntdApp, Button, Drawer, Flex, Form } from 'antd'
import { useState } from 'react'
import { FormProvider } from 'react-hook-form'

const categoryCreateDefaultValues: CategoryFormValues = {
  slug: '',
  title: '',
}

/**
 * Props drawer-а создания категории.
 */
export type CreateCategoryDrawerProps = {
  onClose: () => void
  onCreated?: (category: PlaceCategoryResponseDto) => void
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
  const form = useZodForm(createCategoryFormSchema, {
    defaultValues: categoryCreateDefaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { isDirty } = form.formState
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const createCategoryMutation = useCreateCategoryMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (category) => {
      setErrorMessages([])
      form.reset()
      void message.success('Категория создана')
      onCreated?.(category)
      onClose()
    },
  })

  const closeClean = () => {
    setErrorMessages([])
    form.reset()
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

  const handleSubmit = (values: CategoryFormValues) => {
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
      <FormProvider {...form}>
        <form
          name="create-category"
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {Boolean(errorMessages.length) && (
            <Form.Item layout="vertical">
              <CategoryFormErrorAlert
                messages={errorMessages}
                title="Не удалось создать категорию"
              />
            </Form.Item>
          )}

          <CategoryFormFields
            control={form.control}
            disabled={createCategoryMutation.isPending}
          />

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
        </form>
      </FormProvider>
    </Drawer>
  )
}
