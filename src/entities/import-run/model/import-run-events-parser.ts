import type { ImportRunResponseDto } from '@/shared/api'
import { AdminImportRunsList200Response } from '@/shared/api'

/**
 * Парсит payload SSE-события import run через generated OpenAPI/Zod contract.
 *
 * @remarks Malformed JSON или несоответствие `ImportRunResponseDto` contract должны
 * переводить подписку в fallback refetch, а не попадать в React Query cache.
 */
export const parseImportRunEventData = (data: string): ImportRunResponseDto => {
  const parsed: unknown = JSON.parse(data)
  const response = AdminImportRunsList200Response.parse({
    items: [parsed],
  })
  const importRun = response.items[0]

  if (!importRun) {
    throw new Error('Unexpected import run SSE payload')
  }

  return importRun
}
