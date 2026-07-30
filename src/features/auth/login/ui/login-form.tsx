import { useLoginSession } from '@/entities/session/model/session-hooks'
import {
  loginFormSchema,
  type LoginFormValues,
} from '@/features/auth/login/model/login-form-schema'
import { clearBulkModerationDraftSelection } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { RhfFormItem } from '@/shared/ui/form/rhf-form-item'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Input } from 'antd'
import { FormProvider } from 'react-hook-form'

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
  const form = useZodForm(loginFormSchema, {
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const loginMutation = useLoginSession({
    onError: (error) => {
      void message.error(getApiErrorPresentation(error).message)
    },
    onSuccess: () => {
      clearBulkModerationDraftSelection()
      onLoggedIn()
    },
  })

  const handleSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      data: values,
    })
  }

  return (
    <FormProvider {...form}>
      <form
        name="admin-login"
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <RhfFormItem control={form.control} label="Email" name="email">
          {(field, controlProps) => (
            <Input
              aria-describedby={controlProps['aria-describedby']}
              aria-invalid={controlProps['aria-invalid']}
              autoComplete="email"
              id={controlProps.id}
              onBlur={field.onBlur}
              onChange={field.onChange}
              prefix={<MailOutlined />}
              ref={(input) => field.ref(input?.input ?? null)}
              size="large"
              status={controlProps.status}
              value={field.value}
            />
          )}
        </RhfFormItem>

        <RhfFormItem control={form.control} label="Пароль" name="password">
          {(field, controlProps) => (
            <Input.Password
              aria-describedby={controlProps['aria-describedby']}
              aria-invalid={controlProps['aria-invalid']}
              autoComplete="current-password"
              id={controlProps.id}
              onBlur={field.onBlur}
              onChange={field.onChange}
              prefix={<LockOutlined />}
              ref={(input) => field.ref(input?.input ?? null)}
              size="large"
              status={controlProps.status}
              value={field.value}
            />
          )}
        </RhfFormItem>

        <Button
          block
          htmlType="submit"
          loading={loginMutation.isPending}
          size="large"
          type="primary"
        >
          Войти
        </Button>
      </form>
    </FormProvider>
  )
}
