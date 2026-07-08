/**
 * Форматирует datetime категории без timezone-пересчета.
 */
export function formatCategoryDateTime(value: string) {
  return value.slice(0, 16).replace('T', ' ')
}
