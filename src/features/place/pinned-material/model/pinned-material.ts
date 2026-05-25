import type { SetPinnedMaterialRequest } from '@/shared/api/generated/model'

/**
 * Строит payload назначения закрепленного материала.
 *
 * @returns `null`, если выбранное значение не подходит для assign-запроса.
 * Снятие закрепления выполняется отдельной `DELETE`-мутацией.
 */
export function toSetPinnedMaterialRequest(
  materialId: string | null,
): SetPinnedMaterialRequest | null {
  if (!materialId) {
    return null
  }

  return { materialId }
}
