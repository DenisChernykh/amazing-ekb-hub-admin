import type { AdminPlaceSummaryResponseDtoStatus } from '@/shared/api'

/**
 * Нормализует сырое значение в backend-статус места.
 *
 * @remarks Возвращает `null`, если значение не является поддерживаемым `AdminPlaceSummaryResponseDtoStatus`.
 */
export const getPlaceStatusFromValue = (
  value: string | number | null,
): AdminPlaceSummaryResponseDtoStatus | null => {
  if (value === 'active' || value === 'hidden') {
    return value
  }

  return null
}
