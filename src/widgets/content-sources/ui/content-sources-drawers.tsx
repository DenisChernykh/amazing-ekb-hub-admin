import { CreateContentSourceDrawer } from '@/features/content-source/create/ui/create-content-source-drawer'
import { EditContentSourceDrawer } from '@/features/content-source/edit/ui/edit-content-source-drawer'
import type { ContentSource } from '@/shared/api/generated/model'

/**
 * Рендерит create/edit drawers, которыми управляет content sources screen.
 */
export function ContentSourcesDrawers({
  editingSource,
  isCreateOpen,
  onCloseCreate,
  onCloseEdit,
}: {
  editingSource: ContentSource | null
  isCreateOpen: boolean
  onCloseCreate: () => void
  onCloseEdit: () => void
}) {
  return (
    <>
      <CreateContentSourceDrawer onClose={onCloseCreate} open={isCreateOpen} />
      {editingSource && (
        <EditContentSourceDrawer
          contentSource={editingSource}
          onClose={onCloseEdit}
          open={Boolean(editingSource)}
        />
      )}
    </>
  )
}
