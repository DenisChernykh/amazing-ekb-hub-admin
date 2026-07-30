import { useLogoutSession } from '@/entities/session/model/session-hooks'
import { clearBulkModerationDraftSelection } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { LogoutOutlined } from '@ant-design/icons'
import { App as AntdApp, Button } from 'antd'
import { useNavigate } from 'react-router'

/**
 * Кнопка выхода, которая вызывает session logout и возвращает пользователя на login.
 *
 * @remarks После успешного logout очищает browser draft выбора bulk moderation перед навигацией на `/login`.
 */
export function LogoutButton() {
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const logoutMutation = useLogoutSession({
    onError: (error) => {
      void message.error(getApiErrorPresentation(error).message)
    },
    onSuccess: () => {
      clearBulkModerationDraftSelection()
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
