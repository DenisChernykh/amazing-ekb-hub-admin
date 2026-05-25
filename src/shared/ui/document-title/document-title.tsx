import { useEffect } from 'react'
import { buildAdminDocumentTitle } from './build-admin-document-title'

/**
 * Props компонента синхронизации browser title.
 */
export type DocumentTitleProps = {
  title?: string | null
}

/**
 * Синхронизирует `document.title` с текущим экраном админки.
 *
 * @remarks Использует `useEffect`, потому что `document.title` является внешним browser API и не представлен React state.
 */
export function DocumentTitle({ title }: DocumentTitleProps) {
  useEffect(() => {
    document.title = buildAdminDocumentTitle(title)
  }, [title])

  return null
}
