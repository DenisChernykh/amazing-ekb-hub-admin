import { useCreateContentSourceMutation } from '@/entities/content-source/model/content-source-mutations'
import {
  toCreateContentSourceRequest,
  type ContentSourceFormValues,
} from '@/features/content-source/form/model/content-source-form'
import { ContentSourceFormErrorAlert } from '@/features/content-source/form/ui/content-source-form-error-alert'
import { ContentSourceFormFields } from '@/features/content-source/form/ui/content-source-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { ContentSource } from '@/shared/api/generated/model'
import { App as AntdApp, Button, Drawer, Flex, Form } from 'antd'
import { useState } from 'react'

/**
 * Props drawer-а создания content source.
 */
export type CreateContentSourceDrawerProps = {
  onClose: () => void
  onCreated?: (contentSource: ContentSource) => void
  open: boolean
}

/**
 * Drawer-сценарий создания content source.
 *
 * @remarks Отправляет данные через entity-level mutation, показывает AntD notifications и защищает закрытие формы с несохраненными значениями.
 */
export function CreateContentSourceDrawer({
  onClose,
  onCreated,
  open,
}: CreateContentSourceDrawerProps) {
  const { message, modal } = AntdApp.useApp()
  const [form] = Form.useForm<ContentSourceFormValues>()
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const createSourceMutation = useCreateContentSourceMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (contentSource) => {
      setErrorMessages([])
      setIsDirty(false)
      form.resetFields()
      void message.success('Источник создан')
      onCreated?.(contentSource)
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
    if (createSourceMutation.isPending) {
      return
    }

    if (!isDirty) {
      closeClean()
      return
    }

    modal.confirm({
      cancelText: 'Остаться',
      content: 'Несохраненный источник будет потерян.',
      okText: 'Закрыть',
      onOk: closeClean,
      title: 'Закрыть без сохранения?',
    })
  }

  const handleFinish = (values: ContentSourceFormValues) => {
    setErrorMessages([])
    createSourceMutation.mutate(toCreateContentSourceRequest(values))
  }

  return (
    <Drawer
      destroyOnHidden
      onClose={requestClose}
      open={open}
      title="Новый источник"
      width={520}
    >
      <Form<ContentSourceFormValues>
        form={form}
        layout="vertical"
        name="create-content-source"
        onFinish={handleFinish}
        onValuesChange={() => {
          setIsDirty(true)
        }}
        requiredMark={false}
      >
        {Boolean(errorMessages.length) && (
          <Form.Item>
            <ContentSourceFormErrorAlert
              messages={errorMessages}
              title="Не удалось создать источник"
            />
          </Form.Item>
        )}

        <ContentSourceFormFields disabled={createSourceMutation.isPending} />

        <Flex gap={8} justify="end" wrap>
          <Button
            disabled={createSourceMutation.isPending}
            onClick={requestClose}
          >
            Отмена
          </Button>
          <Button
            htmlType="submit"
            loading={createSourceMutation.isPending}
            type="primary"
          >
            Создать
          </Button>
        </Flex>
      </Form>
    </Drawer>
  )
}
