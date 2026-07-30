import { Tag } from 'antd'
import { getRoleMeta } from './role-meta'

type RoleTagProps = {
  roleKey: string
}

/**
 * Отображает backend role key как локализованный Ant Design tag.
 */
export function RoleTag({ roleKey }: RoleTagProps) {
  const meta = getRoleMeta(roleKey)

  return <Tag color={meta.color}>{meta.label}</Tag>
}
