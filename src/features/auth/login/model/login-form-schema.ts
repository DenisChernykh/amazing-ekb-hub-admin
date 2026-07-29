import { LoginBody } from '@/shared/api/generated-zod/auth/auth.zod'
import { z } from 'zod'

const loginEmailSchema = z
  .string()
  .trim()
  .min(1, 'Введите email')
  .refine(
    (email) => LoginBody.shape.email.safeParse(email).success,
    'Введите корректный email',
  )

/** Zod-схема значений формы входа администратора. */
export const loginFormSchema = z.strictObject({
  email: loginEmailSchema,
  password: LoginBody.shape.password.min(1, 'Введите пароль'),
})

/** Значения RHF формы входа до и после Zod validation. */
export type LoginFormValues = z.input<typeof loginFormSchema>
