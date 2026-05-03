import { useLogoutSession } from '@/entities/session/model/session-hooks'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { LogoutOutlined } from '@ant-design/icons'
import { App as AntdApp, Button } from 'antd'
import { useNavigate } from 'react-router'

/**
 * Кнопка выхода, которая вызывает session logout и возвращает пользователя на login.
 */
export function LogoutButton() {
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const logoutMutation = useLogoutSession({
    onError: (error) => {
      void message.error(normalizeApiError(error).message)
    },
    onSuccess: () => {
      navigate('/login', { replace: true })
    },
  })

  return (
    <Button
      icon={<LogoutOutlined aria-hidden="true" />}
      loading={logoutMutation.isPending}
      onClick={() => logoutMutation.mutate()}
    >
      Выйти
    </Button>
  )
}
