import type { AdminPlaceSummaryResponseDtoStatus } from '@/shared/api'
import { Tag } from 'antd'
import { getPlaceStatusMeta } from './place-meta'

type PlaceStatusTagProps = {
  status: AdminPlaceSummaryResponseDtoStatus
}

/**
 * Отображает backend-статус места как локализованный Ant Design tag.
 */
export function PlaceStatusTag({ status }: PlaceStatusTagProps) {
  const meta = getPlaceStatusMeta(status)

  return <Tag color={meta.color}>{meta.label}</Tag>
}
