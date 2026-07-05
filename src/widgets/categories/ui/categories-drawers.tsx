import { CreateCategoryDrawer } from '@/features/category/create/ui/create-category-drawer'
import { EditCategoryDrawer } from '@/features/category/edit/ui/edit-category-drawer'
import type { AdminPlaceCategory } from '@/shared/api/generated/model'

/**
 * Рендерит create/edit drawers, которыми управляет categories screen.
 */
export function CategoriesDrawers({
  editingCategory,
  isCreateOpen,
  onCloseCreate,
  onCloseEdit,
}: {
  editingCategory: AdminPlaceCategory | null
  isCreateOpen: boolean
  onCloseCreate: () => void
  onCloseEdit: () => void
}) {
  return (
    <>
      <CreateCategoryDrawer onClose={onCloseCreate} open={isCreateOpen} />
      {editingCategory && (
        <EditCategoryDrawer
          category={editingCategory}
          onClose={onCloseEdit}
          open={Boolean(editingCategory)}
        />
      )}
    </>
  )
}
