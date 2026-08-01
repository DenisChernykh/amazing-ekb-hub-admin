import {
  getLoginFormError,
  mapLoginValidationErrors,
  type LoginField,
} from '@/features/auth/login/model/login-errors'
import {
  loginFormSchema,
  type LoginFormValues,
} from '@/features/auth/login/model/login-form-schema'
import { useLogin } from '@/features/auth/login/model/use-login'
import { ApiProblemError } from '@/shared/api'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { isOneOf } from '@/shared/lib/type/is-one-of'
import { RhfFormItem } from '@/shared/ui/form/rhf-form-item'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, Button, Input } from 'antd'
import { useState } from 'react'
import { FormProvider } from 'react-hook-form'

type LoginFormProps = {
  returnTo: string | null
}

const loginFields: readonly LoginField[] = ['email', 'password']

/**
 * Ant Design форма входа с RHF/Zod validation и безопасными API-ошибками.
 *
 * @remarks Передаёт успешный login в `useLogin`. Разрешает backend field detail
 * только для `/email` и `/password`; остальные ошибки показывает как безопасный
 * общий Ant Design alert.
 */
export function LoginForm({ returnTo }: LoginFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const form = useZodForm(loginFormSchema, {
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const login = useLogin(returnTo)

  const handleSubmit = async (values: LoginFormValues) => {
    setFormError(null)

    try {
      await login.mutateAsync(values)
    } catch (error) {
      if (
        error instanceof ApiProblemError &&
        error.code === 'VALIDATION_FAILED'
      ) {
        const fieldErrors = mapLoginValidationErrors(error.problem)

        for (const [field, message] of Object.entries(fieldErrors)) {
          if (!isOneOf(loginFields, field)) {
            continue
          }

          form.setError(field, {
            message,
            type: 'server',
          })
        }

        if (Object.keys(fieldErrors).length > 0) {
          return
        }
      }

      setFormError(getLoginFormError(error))
    }
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

        {formError !== null && (
          <Alert message={formError} showIcon type="error" />
        )}

        <Button
          block
          htmlType="submit"
          loading={login.isPending}
          size="large"
          type="primary"
        >
          Войти
        </Button>
      </form>
    </FormProvider>
  )
}
