import { AuthLoginBody } from '@/shared/api/generated-zod/auth/auth.zod'
import { z } from 'zod'

/** Сгенерированная из backend OpenAPI Zod-схема формы входа администратора. */
export const loginFormSchema = AuthLoginBody

/** Значения RHF формы входа до и после Zod validation. */
export type LoginFormValues = z.input<typeof loginFormSchema>
