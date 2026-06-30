import type { MaterialFormChangedField } from '@/features/material/form/model/material-form'
import { Space, Tag } from 'antd'

/**
 * Рендерит chips измененных полей материала в edit drawer.
 */
export function MaterialFormChangedFields({
  fields,
}: {
  fields: MaterialFormChangedField[]
}) {
  return (
    <Space size={[4, 4]} wrap>
      {fields.map((field) => (
        <Tag key={field.key}>{field.label}</Tag>
      ))}
    </Space>
  )
}
