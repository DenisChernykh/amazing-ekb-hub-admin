import type { PlaceStatus } from '@/shared/api/generated/model'

/**
 * Нормализует сырое значение в backend-статус места.
 *
 * @remarks Возвращает `null`, если значение не является поддерживаемым `PlaceStatus`.
 */
export const getPlaceStatusFromValue = (
  value: string | number | null,
): PlaceStatus | null => {
  if (value === 'active' || value === 'hidden') {
    return value
  }

  return null
}
