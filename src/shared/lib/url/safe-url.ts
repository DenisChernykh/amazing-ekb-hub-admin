const HTTP_URL_ERROR_MESSAGE = 'Введите ссылку с протоколом http или https'

const safeHttpProtocols = new Set(['http:', 'https:'])

const parseAbsoluteUrl = (value: string) => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * Проверяет, что значение является абсолютным `http` или `https` URL.
 */
export function isSafeHttpUrl(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return false
  }

  const parsedUrl = parseAbsoluteUrl(trimmedValue)

  return Boolean(parsedUrl && safeHttpProtocols.has(parsedUrl.protocol))
}

/**
 * Возвращает текст ошибки для unsafe `http/https` ссылки или `null` для допустимого значения.
 *
 * @remarks Пустое значение считается отсутствием локальной ошибки, чтобы required-валидация формы показывала собственное сообщение.
 */
export function getHttpUrlValidationError(value: string | undefined) {
  if (!value?.trim()) {
    return null
  }

  return isSafeHttpUrl(value) ? null : HTTP_URL_ERROR_MESSAGE
}

/**
 * Нормализует `http/https` ссылку перед отправкой в API.
 *
 * @remarks Бросает ошибку, если форма попыталась собрать payload с unsafe ссылкой.
 */
export function normalizeHttpUrl(value: string | undefined) {
  const normalizedValue = (value ?? '').trim()

  if (!isSafeHttpUrl(normalizedValue)) {
    throw new Error(HTTP_URL_ERROR_MESSAGE)
  }

  return normalizedValue
}
