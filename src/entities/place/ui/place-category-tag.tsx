import type { PlaceSummaryCategoryResponseDto } from '@/shared/api'
import { Tag } from 'antd'
import { getPlaceCategoryMeta } from './place-meta'

type PlaceCategoryTagProps = {
  category: PlaceSummaryCategoryResponseDto
}

/**
 * Отображает summary-категорию места как локализованный Ant Design tag.
 */
export function PlaceCategoryTag({ category }: PlaceCategoryTagProps) {
  const meta = getPlaceCategoryMeta(category)

  return <Tag color={meta.color}>{meta.label}</Tag>
}
