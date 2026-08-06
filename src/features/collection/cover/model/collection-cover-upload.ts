const MAX_COLLECTION_COVER_BYTES = 5 * 1024 * 1024
const allowedCollectionCoverTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

/** Проверяет MIME и размер cover-фото коллекции до отправки. */
export function getCollectionCoverUploadError(
  file: Pick<File, 'size' | 'type'>,
) {
  if (!allowedCollectionCoverTypes.has(file.type))
    return 'Выберите JPG, PNG или WebP изображение.'
  if (file.size > MAX_COLLECTION_COVER_BYTES)
    return 'Размер cover-фото не должен превышать 5 МБ.'
  return null
}
