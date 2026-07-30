import type { SetPinnedMaterialDto } from '@/shared/api'

/**
 * Строит payload назначения закрепленного материала.
 *
 * @returns `null`, если выбранное значение не подходит для assign-запроса.
 * Снятие закрепления выполняется отдельной `DELETE`-мутацией.
 */
export function toSetPinnedMaterialRequest(
  materialId: string | null,
): SetPinnedMaterialDto | null {
  if (!materialId) {
    return null
  }

  return { materialId }
}
