import { z } from 'zod'

const publicEnvSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .default('/')
    .transform((value, ctx) => {
      if (value === '/') {
        return value
      }

      if (value !== value.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'VITE_API_BASE_URL должен быть API origin без пробелов.',
        })

        return z.NEVER
      }

      let url: URL

      try {
        url = new URL(value)
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'VITE_API_BASE_URL должен быть абсолютным HTTP(S) origin.',
        })

        return z.NEVER
      }

      if (
        (url.protocol !== 'http:' && url.protocol !== 'https:') ||
        url.username ||
        url.password ||
        url.pathname !== '/' ||
        url.search ||
        url.hash
      ) {
        ctx.addIssue({
          code: 'custom',
          message:
            'VITE_API_BASE_URL должен быть API origin без пути и параметров.',
        })

        return z.NEVER
      }

      return value.endsWith('/') ? value.slice(0, -1) : value
    }),
})

/** Публичные переменные окружения browser bundle. */
export type PublicEnv = z.infer<typeof publicEnvSchema>

/** Проверяет, что API задан same-origin root или абсолютным HTTP(S) origin. */
export function parsePublicEnv(
  input: Record<string, string | boolean | undefined>,
): PublicEnv {
  return publicEnvSchema.parse(input)
}

/** Проверенная публичная конфигурация приложения. */
export const publicEnv = parsePublicEnv(import.meta.env)
