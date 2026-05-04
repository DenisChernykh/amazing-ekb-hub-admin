import type { PlaceStatus } from '@/shared/api/generated/model'
import { Tag } from 'antd'
import { getPlaceStatusMeta } from './place-meta'

type PlaceStatusTagProps = {
  status: PlaceStatus
}

/**
 * Отображает backend-статус места как локализованный Ant Design tag.
 */
export function PlaceStatusTag({ status }: PlaceStatusTagProps) {
  const meta = getPlaceStatusMeta(status)

  return <Tag color={meta.color}>{meta.label}</Tag>
}
