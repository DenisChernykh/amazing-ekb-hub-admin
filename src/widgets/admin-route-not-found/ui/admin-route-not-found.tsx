import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import { ScreenResultState } from '@/shared/ui/screen-state/screen-state'

/**
 * Protected route state для неизвестных URL внутри admin shell.
 */
export function AdminRouteNotFound() {
  return (
    <>
      <DocumentTitle title="Раздел не найден" />
      <ScreenResultState
        primaryAction={{ label: 'На главную', to: '/' }}
        status="404"
        subTitle="Такого раздела в админке нет или он еще не подключен."
        title="Раздел не найден"
      />
    </>
  )
}
