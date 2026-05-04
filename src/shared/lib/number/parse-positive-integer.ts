/**
 * Парсит положительное целое число из строкового значения.
 *
 * @returns Положительное целое число или переданный fallback, если значение отсутствует или невалидно.
 */
export const parsePositiveInteger = (
  value: string | null,
  fallback: number,
) => {
  const parsedValue = Number(value)

  if (Number.isInteger(parsedValue) && parsedValue > 0) {
    return parsedValue
  }

  return fallback
}
