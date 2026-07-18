const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Проверяет строку на соответствие публичному backend-формату slug.
 */
export function isValidSlug(value: string) {
  return slugPattern.test(value)
}
