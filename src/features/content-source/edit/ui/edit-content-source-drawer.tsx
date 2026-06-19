import { useUpdateContentSourceMutation } from '@/entities/content-source/model/content-source-mutations'
import {
  getContentSourceFormChangedFields,
  getContentSourceFormInitialValues,
  hasContentSourceFormChanges,
  toUpdateContentSourceRequest,
  type ContentSourceFormChangedField,
  type ContentSourceFormValues,
} from '@/features/content-source/form/model/content-source-form'
import { ContentSourceFormErrorAlert } from '@/features/content-source/form/ui/content-source-form-error-alert'
import { ContentSourceFormFields } from '@/features/content-source/form/ui/content-source-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { ContentSource } from '@/shared/api/generated/model'
import { App as AntdApp, Button, Drawer, Flex, Form, Space, Tag } from 'antd'
import { useState } from 'react'

/**
 * Props drawer-а редактирования content source.
 */
export type EditContentSourceDrawerProps = {
  contentSource: ContentSource
  onClose: () => void
  onUpdated?: (contentSource: ContentSource) => void
  open: boolean
}

/**
 * Drawer-сценарий редактирования content source с dirty diff chips.
 *
 * @remarks Platform остается read-only: backend update endpoint не меняет платформу source.
 */
export function EditContentSourceDrawer({
  contentSource,
  onClose,
  onUpdated,
  open,
}: EditContentSourceDrawerProps) {
  const { message, modal } = AntdApp.useApp()
  const [form] = Form.useForm<ContentSourceFormValues>()
  const initialValues = getContentSourceFormInitialValues(contentSource)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [changedFields, setChangedFields] = useState<
    ContentSourceFormChangedField[]
  >([])
  const updateSourceMutation = useUpdateContentSourceMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (updatedSource) => {
      setErrorMessages([])
      setIsDirty(false)
      setChangedFields([])
      void message.success('Источник обновлен')
      onUpdated?.(updatedSource)
      onClose()
    },
  })

  const updateDirtyState = () => {
    const values = form.getFieldsValue()
    setIsDirty(hasContentSourceFormChanges(values, initialValues))
    setChangedFields(getContentSourceFormChangedFields(values, initialValues))
  }

  const closeClean = () => {
    setErrorMessages([])
    setIsDirty(false)
    setChangedFields([])
    form.resetFields()
    onClose()
  }

  const requestClose = () => {
    if (updateSourceMutation.isPending) {
      return
    }

    if (!isDirty) {
      closeClean()
      return
    }

    modal.confirm({
      cancelText: 'Остаться',
      content: 'Несохраненные изменения источника будут потеряны.',
      okText: 'Закрыть',
      onOk: closeClean,
      title: 'Закрыть без сохранения?',
    })
  }

  const handleFinish = (values: ContentSourceFormValues) => {
    const data = toUpdateContentSourceRequest(values, initialValues)

    if (!Object.keys(data).length) {
      setIsDirty(false)
      setChangedFields([])
      return
    }

    setErrorMessages([])
    updateSourceMutation.mutate({
      data,
      sourceId: contentSource.id,
    })
  }

  return (
    <Drawer
      destroyOnHidden
      onClose={requestClose}
      open={open}
      title="Редактирование источника"
      width={520}
    >
      <Form<ContentSourceFormValues>
        form={form}
        initialValues={initialValues}
        layout="vertical"
        name="edit-content-source"
        onFinish={handleFinish}
        onValuesChange={updateDirtyState}
        requiredMark={false}
      >
        {Boolean(errorMessages.length) && (
          <Form.Item>
            <ContentSourceFormErrorAlert
              messages={errorMessages}
              title="Не удалось обновить источник"
            />
          </Form.Item>
        )}

        {Boolean(changedFields.length) && (
          <Form.Item>
            <Space size={[4, 4]} wrap>
              {changedFields.map((field) => (
                <Tag key={field.key}>{field.label}</Tag>
              ))}
            </Space>
          </Form.Item>
        )}

        <ContentSourceFormFields
          disabled={updateSourceMutation.isPending}
          platformDisabled
        />

        <Flex gap={8} justify="end" wrap>
          <Button
            disabled={updateSourceMutation.isPending}
            onClick={requestClose}
          >
            Отмена
          </Button>
          <Button
            disabled={!isDirty}
            htmlType="submit"
            loading={updateSourceMutation.isPending}
            type="primary"
          >
            Сохранить
          </Button>
        </Flex>
      </Form>
    </Drawer>
  )
}
