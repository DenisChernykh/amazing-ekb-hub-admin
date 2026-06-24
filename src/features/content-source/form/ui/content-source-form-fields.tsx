import { getContentSourcePlatformOptions } from '@/entities/content-source/ui/content-source-meta'
import { getHttpUrlValidationError } from '@/shared/lib/url/safe-url'
import { Form, Input, Select } from 'antd'
import type { ContentSourceFormValues } from '../model/content-source-form'

/**
 * Props набора полей формы content source.
 */
export type ContentSourceFormFieldsProps = {
  disabled?: boolean
  platformDisabled?: boolean
}

/**
 * Общие Ant Design поля создания и редактирования content source.
 */
export function ContentSourceFormFields({
  disabled,
  platformDisabled,
}: ContentSourceFormFieldsProps) {
  return (
    <>
      <Form.Item<ContentSourceFormValues>
        label="Платформа"
        name="platform"
        rules={[{ message: 'Выберите платформу', required: true }]}
      >
        <Select
          aria-label="Платформа"
          disabled={disabled || platformDisabled}
          options={getContentSourcePlatformOptions()}
        />
      </Form.Item>

      <Form.Item<ContentSourceFormValues>
        label="Название"
        name="displayName"
        rules={[
          { message: 'Введите название', required: true, whitespace: true },
        ]}
      >
        <Input aria-label="Название" disabled={disabled} />
      </Form.Item>

      <Form.Item<ContentSourceFormValues>
        label="Ссылка"
        name="url"
        rules={[
          { message: 'Введите ссылку', required: true, whitespace: true },
          {
            validator: async (_rule, value: unknown) => {
              if (typeof value !== 'string') {
                return
              }

              const validationError = getHttpUrlValidationError(value)

              if (validationError) {
                throw new Error(validationError)
              }
            },
          },
        ]}
      >
        <Input aria-label="Ссылка" disabled={disabled} />
      </Form.Item>

      <Form.Item<ContentSourceFormValues> label="External ID" name="externalId">
        <Input aria-label="External ID" disabled={disabled} />
      </Form.Item>

      <Form.Item<ContentSourceFormValues> label="Handle" name="handle">
        <Input aria-label="Handle" disabled={disabled} />
      </Form.Item>

      <Form.Item<ContentSourceFormValues> label="Channel ID" name="channelId">
        <Input aria-label="Channel ID" disabled={disabled} />
      </Form.Item>
    </>
  )
}
