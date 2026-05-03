import type { Role } from '@/shared/api/generated/model'
import type { TagProps } from 'antd'

/**
 * UI-метаданные роли для отображения в Ant Design компонентах.
 */
export type RoleMeta = {
  color: TagProps['color']
  label: string
}

const roleMeta = {
  admin: {
    color: 'green',
    label: 'Администратор',
  },
  user: {
    color: 'blue',
    label: 'Пользователь',
  },
} satisfies Record<Role, RoleMeta>

/**
 * Возвращает локализованные UI-метаданные для backend-роли.
 */
export const getRoleMeta = (role: Role) => roleMeta[role]
