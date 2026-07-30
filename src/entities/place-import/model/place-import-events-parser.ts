import type { PlaceImportEventsResponseDto } from '@/shared/api'
import { AdminPlaceImportsGetEvents200Response } from '@/shared/api'

/** Валидирует SSE payload тем же generated Zod contract, что и polling response. */
export function parsePlaceImportEventData(
  data: string,
): PlaceImportEventsResponseDto {
  return AdminPlaceImportsGetEvents200Response.parse(JSON.parse(data))
}
