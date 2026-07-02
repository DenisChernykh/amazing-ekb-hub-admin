import { getMaterialUrlValidationError } from '@/entities/material/model/material-url'
import {
  getMaterialPlatformOptions,
  getMaterialTypeOptions,
} from '@/entities/material/ui/material-meta'
import { DatePicker, Form, Input, InputNumber, Select } from 'antd'
import {
  isMaterialDurationEnabled,
  type MaterialFormValues,
} from '../model/material-form'

/**
 * Props набора полей формы материала.
 */
export type MaterialFormFieldsProps = {
  disabled?: boolean
  showUrlField?: boolean
}

/**
 * Общие Ant Design поля создания и редактирования материала.
 */
export function MaterialFormFields({
  disabled,
  showUrlField = true,
}: MaterialFormFieldsProps) {
  return (
    <>
      <Form.Item<MaterialFormValues>
        label="Платформа"
        name="platform"
        rules={[{ message: 'Выберите платформу', required: true }]}
      >
        <Select
          aria-label="Платформа"
          disabled={disabled}
          options={getMaterialPlatformOptions()}
        />
      </Form.Item>

      <Form.Item<MaterialFormValues>
        label="Тип"
        name="type"
        rules={[{ message: 'Выберите тип материала', required: true }]}
      >
        <Select
          aria-label="Тип"
          disabled={disabled}
          options={getMaterialTypeOptions()}
        />
      </Form.Item>

      <Form.Item<MaterialFormValues>
        label="Заголовок"
        name="title"
        rules={[{ message: 'Введите заголовок', required: true }]}
      >
        <Input aria-label="Заголовок" disabled={disabled} />
      </Form.Item>

      <Form.Item<MaterialFormValues>
        label="Дата публикации"
        name="publishedAt"
        rules={[{ message: 'Выберите дату публикации', required: true }]}
      >
        <DatePicker
          aria-label="Дата публикации"
          disabled={disabled}
          format="DD.MM.YYYY"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item<MaterialFormValues>
        noStyle
        shouldUpdate={(previousValues, currentValues) =>
          previousValues.type !== currentValues.type
        }
      >
        {({ getFieldValue }) =>
          isMaterialDurationEnabled(getFieldValue('type')) && (
            <Form.Item<MaterialFormValues>
              label="Длительность, сек"
              name="durationSec"
            >
              <InputNumber
                aria-label="Длительность, сек"
                disabled={disabled}
                min={0}
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          )
        }
      </Form.Item>

      {showUrlField && (
        <Form.Item<MaterialFormValues>
          label="Ссылка"
          name="url"
          rules={[
            { message: 'Введите ссылку', required: true, whitespace: true },
            {
              validator: async (_rule, value: unknown) => {
                if (typeof value !== 'string') {
                  return
                }

                const validationError = getMaterialUrlValidationError(value)

                if (validationError) {
                  throw new Error(validationError)
                }
              },
            },
          ]}
        >
          <Input aria-label="Ссылка" disabled={disabled} />
        </Form.Item>
      )}
    </>
  )
}
