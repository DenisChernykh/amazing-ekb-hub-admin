import type { SetPinnedMaterialRequest } from '@/shared/api/generated/model'

/**
 * Строит payload назначения закрепленного материала.
 *
 * @returns `null`, если выбранное значение означает clear. Текущий backend
 * contract не поддерживает снятие закрепленного материала, поэтому UI не должен
 * отправлять запрос без `materialId`.
 */
export function toSetPinnedMaterialRequest(
  materialId: string | null,
): SetPinnedMaterialRequest | null {
  if (!materialId) {
    return null
  }

  return { materialId }
}
