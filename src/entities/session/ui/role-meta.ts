import type { TagProps } from 'antd'

/**
 * UI-метаданные роли для отображения в Ant Design компонентах.
 */
export type RoleMeta = {
  color: TagProps['color']
  label: string
}

const roleMeta: Record<string, RoleMeta> = {
  admin: {
    color: 'green',
    label: 'Администратор',
  },
  user: {
    color: 'blue',
    label: 'Пользователь',
  },
}

/**
 * Возвращает локализованные UI-метаданные для backend role key.
 *
 * @remarks Неизвестный ключ остается видимым, чтобы новый backend role key не
 * терялся в интерфейсе до добавления локализованной подписи.
 */
export const getRoleMeta = (roleKey: string): RoleMeta => {
  return roleMeta[roleKey] ?? { color: 'default', label: roleKey }
}
