import { AdminPlaceImportsGetEvents200Response } from '@/shared/api/generated-zod/admin-place-imports/admin-place-imports.zod'
import type { PlaceImportEventsResponse } from '@/shared/api/generated/operation'

/** Валидирует SSE payload тем же generated Zod contract, что и polling response. */
export function parsePlaceImportEventData(
  data: string,
): PlaceImportEventsResponse {
  return AdminPlaceImportsGetEvents200Response.parse(JSON.parse(data))
}
