import { useLoginSession } from '@/entities/session/model/session-hooks'
import { clearBulkModerationDraftSelection } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Form, Input } from 'antd'

type LoginFormValues = {
  email: string
  password: string
}

type LoginFormProps = {
  onLoggedIn: () => void
}

/**
 * Ant Design форма входа, работающая только через session hooks.
 *
 * @remarks После успешного login очищает browser draft выбора bulk moderation перед переходом в приватную часть.
 */
export function LoginForm({ onLoggedIn }: LoginFormProps) {
  const { message } = AntdApp.useApp()
  const loginMutation = useLoginSession({
    onError: (error) => {
      void message.error(normalizeApiError(error).message)
    },
    onSuccess: () => {
      clearBulkModerationDraftSelection()
      onLoggedIn()
    },
  })

  const handleFinish = (values: LoginFormValues) => {
    loginMutation.mutate({
      data: values,
    })
  }

  return (
    <Form<LoginFormValues>
      layout="vertical"
      name="admin-login"
      onFinish={handleFinish}
      requiredMark={false}
    >
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Введите email' },
          { type: 'email', message: 'Введите корректный email' },
        ]}
      >
        <Input autoComplete="email" prefix={<MailOutlined />} size="large" />
      </Form.Item>

      <Form.Item
        label="Пароль"
        name="password"
        rules={[{ required: true, message: 'Введите пароль' }]}
      >
        <Input.Password
          autoComplete="current-password"
          prefix={<LockOutlined />}
          size="large"
        />
      </Form.Item>

      <Button
        block
        htmlType="submit"
        loading={loginMutation.isPending}
        size="large"
        type="primary"
      >
        Войти
      </Button>
    </Form>
  )
}
