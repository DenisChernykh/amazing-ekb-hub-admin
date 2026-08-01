import { useCreatePlaceMaterialMutation } from '@/entities/material/model/material-mutations'
import {
  toCreateMaterialRequest,
  type MaterialFormValues,
} from '@/features/material/form/model/material-form'
import { createMaterialFormSchema } from '@/features/material/form/model/material-form-schema'
import { MaterialFormErrorAlert } from '@/features/material/form/ui/material-form-error-alert'
import { MaterialFormFields } from '@/features/material/form/ui/material-form-fields'
import { getCreateMaterialError } from '@/features/material/model/material-errors'
import type { MaterialResponseDto } from '@/shared/api'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { App as AntdApp, Button, Drawer, Flex, Form } from 'antd'
import { useState } from 'react'
import { FormProvider } from 'react-hook-form'

const createMaterialFormDefaultValues: MaterialFormValues = {
  durationSec: null,
  platform: null,
  publishedAt: null,
  title: '',
  type: null,
  url: '',
}

/**
 * Props drawer-а создания материала.
 */
export type CreateMaterialDrawerProps = {
  onClose: () => void
  onCreated?: (material: MaterialResponseDto) => void
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
  const form = useZodForm(createMaterialFormSchema, {
    defaultValues: createMaterialFormDefaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const { isDirty } = form.formState
  const createMaterialMutation = useCreatePlaceMaterialMutation({
    onError: (error) => {
      const errorMessage = getCreateMaterialError(error)
      setErrorMessages([errorMessage])
      void message.error(errorMessage)
    },
    onSuccess: (material) => {
      setErrorMessages([])
      form.reset()
      void message.success('Материал добавлен')
      onCreated?.(material)
      onClose()
    },
  })

  const closeClean = () => {
    setErrorMessages([])
    form.reset()
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

  const handleSubmit = (values: MaterialFormValues) => {
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
      <FormProvider {...form}>
        <form
          name="create-material"
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {Boolean(errorMessages.length) && (
            <Form.Item layout="vertical">
              <MaterialFormErrorAlert
                messages={errorMessages}
                title="Не удалось добавить материал"
              />
            </Form.Item>
          )}

          <MaterialFormFields
            control={form.control}
            disabled={createMaterialMutation.isPending}
          />

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
        </form>
      </FormProvider>
    </Drawer>
  )
}
