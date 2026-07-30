import { useDeleteCategoryMutation } from '@/entities/category/model/category-mutations'
import type { PlaceCategoryResponseDto } from '@/shared/api'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { DeleteOutlined } from '@ant-design/icons'
import { App as AntdApp, Button } from 'antd'

/**
 * Props кнопки удаления категории места.
 */
export type DeleteCategoryButtonProps = {
  category: PlaceCategoryResponseDto
}

/**
 * Удаляет неиспользуемую категорию после подтверждения.
 *
 * @remarks Требует AntD `App` provider; backend вернет `409`, если категория связана с местами.
 */
export function DeleteCategoryButton({ category }: DeleteCategoryButtonProps) {
  const { message, modal } = AntdApp.useApp()
  const deleteCategoryMutation = useDeleteCategoryMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      void message.error(apiError.message)
    },
    onSuccess: () => {
      void message.success('Категория удалена')
    },
  })

  const handleDelete = () => {
    modal.confirm({
      cancelText: 'Отмена',
      content:
        'Удалить можно только категорию, которая не используется ни одним местом.',
      okButtonProps: {
        danger: true,
      },
      okText: 'Удалить',
      onOk: () =>
        deleteCategoryMutation.mutateAsync({
          categoryId: category.id,
        }),
      title: `Удалить категорию «${category.title}»?`,
    })
  }

  return (
    <Button
      danger
      disabled={deleteCategoryMutation.isPending}
      icon={<DeleteOutlined aria-hidden="true" />}
      loading={deleteCategoryMutation.isPending}
      onClick={handleDelete}
      size="small"
    >
      Удалить
    </Button>
  )
}
