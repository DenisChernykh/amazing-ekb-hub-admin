import type { ContentSourceFormChangedField } from '@/features/content-source/form/model/content-source-form'
import { Space, Tag } from 'antd'

/**
 * Рендерит chips измененных полей content source в edit drawer.
 */
export function ContentSourceFormChangedFields({
  fields,
}: {
  fields: ContentSourceFormChangedField[]
}) {
  return (
    <Space size={[4, 4]} wrap>
      {fields.map((field) => (
        <Tag key={field.key}>{field.label}</Tag>
      ))}
    </Space>
  )
}
