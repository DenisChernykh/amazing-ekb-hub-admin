import { AdminImportRunsList200Response } from '@/shared/api/generated-zod/admin-import-runs/admin-import-runs.zod'
import type { ImportRun } from '@/shared/api/generated/model'

/**
 * Парсит payload SSE-события import run через generated OpenAPI/Zod contract.
 *
 * @remarks Malformed JSON или несоответствие `ImportRun` contract должны
 * переводить подписку в fallback refetch, а не попадать в React Query cache.
 */
export const parseImportRunEventData = (data: string): ImportRun => {
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
