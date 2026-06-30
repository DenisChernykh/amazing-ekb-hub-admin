/**
 * Проверяет, можно ли безопасно читать у значения строковые object-поля.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
