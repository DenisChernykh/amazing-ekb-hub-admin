import type { CategoryFormChangedField } from '@/features/category/form/model/category-form'
import { Space, Tag } from 'antd'

/**
 * Рендерит chips измененных полей категории в edit drawer.
 */
export function CategoryFormChangedFields({
  fields,
}: {
  fields: CategoryFormChangedField[]
}) {
  return (
    <Space size={[4, 4]} wrap>
      {fields.map((field) => (
        <Tag key={field.key}>{field.label}</Tag>
      ))}
    </Space>
  )
}
