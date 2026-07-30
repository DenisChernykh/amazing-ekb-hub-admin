import type { PlaceCategoryResponseDto } from '@/shared/api'
import { Tag } from 'antd'

/** Показывает publication status категории в административном UI. */
export function CategoryStatusTag({
  status,
}: {
  status: PlaceCategoryResponseDto['status']
}) {
  return (
    <Tag color={status === 'active' ? 'success' : 'warning'}>
      {status === 'active' ? 'Активная' : 'Черновик'}
    </Tag>
  )
}
