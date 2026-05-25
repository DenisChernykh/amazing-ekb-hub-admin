const ADMIN_DOCUMENT_TITLE = 'Amazing EKB Admin'

/**
 * Возвращает браузерный title для экранов админки.
 *
 * @returns Title с общим суффиксом админки или базовый title, если имя экрана пустое.
 */
export const buildAdminDocumentTitle = (title?: string | null) => {
  const normalizedTitle = title?.trim()

  return normalizedTitle
    ? `${normalizedTitle} | ${ADMIN_DOCUMENT_TITLE}`
    : ADMIN_DOCUMENT_TITLE
}
