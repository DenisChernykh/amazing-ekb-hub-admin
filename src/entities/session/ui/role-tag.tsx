import type { Role } from '@/shared/api/generated/model'
import { Tag } from 'antd'
import { getRoleMeta } from './role-meta'

type RoleTagProps = {
  role: Role
}

/**
 * Отображает backend-роль как локализованный Ant Design tag.
 */
export function RoleTag({ role }: RoleTagProps) {
  const meta = getRoleMeta(role)

  return <Tag color={meta.color}>{meta.label}</Tag>
}
