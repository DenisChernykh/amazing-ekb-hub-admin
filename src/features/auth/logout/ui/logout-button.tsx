import { useLogout } from '@/features/auth/logout/model/use-logout'
import { isProblemCode } from '@/shared/api'
import { LogoutOutlined } from '@ant-design/icons'
import { Alert, Button, Space } from 'antd'

/**
 * Кнопка выхода с безопасным feedback для повторяемой ошибки.
 *
 * @remarks `useLogout` сам обрабатывает успех и истёкшую сессию. Для остальных
 * ошибок компонент не показывает backend copy и оставляет кнопку для retry.
 */
export function LogoutButton() {
  const logout = useLogout()
  const visibleFailure =
    logout.error !== null &&
    !isProblemCode(logout.error, 'AUTHENTICATION_REQUIRED')

  return (
    <Space align="end" direction="vertical" size="small">
      <Button
        icon={<LogoutOutlined aria-hidden="true" />}
        loading={logout.isPending}
        onClick={() => logout.mutate()}
      >
        Выйти
      </Button>
      {visibleFailure && (
        <Alert
          message="Не удалось выйти. Повторите попытку."
          showIcon
          type="error"
        />
      )}
    </Space>
  )
}
