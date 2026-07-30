import { authLoginSchema } from '@/shared/api'
import { z } from 'zod'

/** Сгенерированная из backend OpenAPI Zod-схема формы входа администратора. */
export const loginFormSchema = authLoginSchema

/** Значения RHF формы входа до и после Zod validation. */
export type LoginFormValues = z.input<typeof loginFormSchema>
