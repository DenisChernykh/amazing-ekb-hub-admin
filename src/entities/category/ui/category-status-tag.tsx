import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import { Tag } from 'antd'

/** Показывает publication status категории в административном UI. */
export function CategoryStatusTag({
  status,
}: {
  status: AdminPlaceCategory['status']
}) {
  return (
    <Tag color={status === 'active' ? 'success' : 'warning'}>
      {status === 'active' ? 'Активная' : 'Черновик'}
    </Tag>
  )
}
