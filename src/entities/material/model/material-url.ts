const MATERIAL_URL_ERROR_MESSAGE = 'Введите ссылку с протоколом http или https'

const safeMaterialProtocols = new Set(['http:', 'https:'])

const parseAbsoluteUrl = (value: string) => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * Проверяет, что ссылка материала является абсолютным `http` или `https` URL.
 */
export function isSafeMaterialUrl(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return false
  }

  const parsedUrl = parseAbsoluteUrl(trimmedValue)

  return Boolean(parsedUrl && safeMaterialProtocols.has(parsedUrl.protocol))
}

/**
 * Возвращает текст ошибки для unsafe ссылки материала или `null` для допустимой ссылки.
 *
 * @remarks Пустое значение считается отсутствием локальной ошибки, чтобы required-валидация Ant Design показывала собственное сообщение.
 */
export function getMaterialUrlValidationError(value: string | undefined) {
  if (!value?.trim()) {
    return null
  }

  return isSafeMaterialUrl(value) ? null : MATERIAL_URL_ERROR_MESSAGE
}

/**
 * Нормализует ссылку материала перед отправкой в API.
 *
 * @remarks Бросает ошибку, если форма попыталась собрать payload с не-`http/https` ссылкой.
 */
export function normalizeMaterialUrl(value: string | undefined) {
  const normalizedValue = (value ?? '').trim()

  if (!isSafeMaterialUrl(normalizedValue)) {
    throw new Error(MATERIAL_URL_ERROR_MESSAGE)
  }

  return normalizedValue
}
