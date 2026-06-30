/**
 * Проверяет, входит ли неизвестное строковое значение в readonly allowlist литералов.
 */
export function isOneOf<TValue extends string>(
  values: readonly TValue[],
  value: unknown,
): value is TValue {
  return typeof value === 'string' && values.some((item) => item === value)
}
