import type { PlaceCategory } from '@/shared/api/generated/model'
import { Tag } from 'antd'
import { getPlaceCategoryMeta } from './place-meta'

type PlaceCategoryTagProps = {
  category: PlaceCategory
}

/**
 * Отображает backend-категорию места как локализованный Ant Design tag.
 */
export function PlaceCategoryTag({ category }: PlaceCategoryTagProps) {
  const meta = getPlaceCategoryMeta(category)

  return <Tag color={meta.color}>{meta.label}</Tag>
}
