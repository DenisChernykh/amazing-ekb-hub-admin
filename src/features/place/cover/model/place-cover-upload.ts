/**
 * Максимальный размер cover-фото места в байтах.
 */
export const PLACE_COVER_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024

/**
 * Список MIME-типов, которые backend принимает для cover-фото места.
 */
export const PLACE_COVER_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

/**
 * Значение для `accept` у файлового input/upload control.
 */
export const PLACE_COVER_UPLOAD_ACCEPT = PLACE_COVER_UPLOAD_MIME_TYPES.join(',')

const isSupportedPlaceCoverMimeType = (mimeType: string) =>
  PLACE_COVER_UPLOAD_MIME_TYPES.some((supportedMimeType) => {
    return supportedMimeType === mimeType
  })

/**
 * Проверяет выбранный файл cover-фото до отправки на backend.
 *
 * @returns Текст ошибки для UI или `null`, если файл можно отправлять.
 */
export function getPlaceCoverUploadError(file: File) {
  if (!isSupportedPlaceCoverMimeType(file.type)) {
    return 'Загрузите JPEG, PNG или WebP файл.'
  }

  if (file.size > PLACE_COVER_UPLOAD_MAX_SIZE_BYTES) {
    return 'Файл должен быть не больше 5 MB.'
  }

  return null
}
