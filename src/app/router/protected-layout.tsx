import { AdminShell } from '@/widgets/admin-shell/ui/admin-shell'
import type { ReactNode } from 'react'
import { Outlet } from 'react-router'

/**
 * Соединяет protected route outlet с презентационным admin shell.
 *
 * @remarks Требует React Router context и уже загруженную session query,
 * которую `AdminShell` читает внутри защищённой ветки.
 */
export function ProtectedLayout(): ReactNode {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
}
