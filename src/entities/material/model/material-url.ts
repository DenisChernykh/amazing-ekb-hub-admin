import {
  getHttpUrlValidationError,
  isSafeHttpUrl,
  normalizeHttpUrl,
} from '@/shared/lib/url/safe-url'

/**
 * Проверяет, что ссылка материала является абсолютным `http` или `https` URL.
 */
export function isSafeMaterialUrl(value: string) {
  return isSafeHttpUrl(value)
}

/**
 * Возвращает текст ошибки для unsafe ссылки материала или `null` для допустимой ссылки.
 *
 * @remarks Пустое значение считается отсутствием локальной ошибки, чтобы required-валидация Ant Design показывала собственное сообщение.
 */
export function getMaterialUrlValidationError(value: string | undefined) {
  return getHttpUrlValidationError(value)
}

/**
 * Нормализует ссылку материала перед отправкой в API.
 *
 * @remarks Бросает ошибку, если форма попыталась собрать payload с не-`http/https` ссылкой.
 */
export function normalizeMaterialUrl(value: string | undefined) {
  return normalizeHttpUrl(value)
}
