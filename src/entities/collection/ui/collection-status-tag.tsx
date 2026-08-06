import type { AdminCollectionSummaryResponseDtoStatus } from '@/shared/api'
import { Tag } from 'antd'

/** Показывает статус публикации подборки. */
export function CollectionStatusTag({
  status,
}: {
  status: AdminCollectionSummaryResponseDtoStatus
}) {
  return (
    <Tag color={status === 'active' ? 'success' : 'warning'}>
      {status === 'active' ? 'Активная' : 'Черновик'}
    </Tag>
  )
}
