import { formatCategoryDateTime } from '@/entities/category/ui/category-meta'
import { CategoryStatusTag } from '@/entities/category/ui/category-status-tag'
import { DeleteCategoryButton } from '@/features/category/delete/ui/delete-category-button'
import type { PlaceCategoryResponseDto } from '@/shared/api'
import { EditOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import { Button, Flex, Typography } from 'antd'
import styles from './categories-screen.module.css'

/**
 * Создает колонки таблицы категорий с action-кнопками строк.
 */
export function getCategoriesTableColumns({
  onEdit,
}: {
  onEdit: (category: PlaceCategoryResponseDto) => void
}): TableColumnsType<PlaceCategoryResponseDto> {
  return [
    {
      dataIndex: 'title',
      key: 'title',
      render: (
        title: PlaceCategoryResponseDto['title'],
        category: PlaceCategoryResponseDto,
      ) => (
        <Flex className={styles.categoryCell} gap={4} vertical>
          <Typography.Text strong>{title}</Typography.Text>
          <Typography.Text type="secondary">{category.id}</Typography.Text>
        </Flex>
      ),
      title: 'Категория',
    },
    {
      dataIndex: 'slug',
      key: 'slug',
      render: (slug: PlaceCategoryResponseDto['slug']) => (
        <Typography.Text code>{slug}</Typography.Text>
      ),
      title: 'Ярлык',
    },
    {
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: PlaceCategoryResponseDto['updatedAt']) =>
        formatCategoryDateTime(value),
      title: 'Обновлена',
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: PlaceCategoryResponseDto['status']) => (
        <CategoryStatusTag status={status} />
      ),
      title: 'Статус',
    },
    {
      key: 'actions',
      render: (_value: unknown, category: PlaceCategoryResponseDto) => (
        <Flex className={styles.actions} gap={8} vertical>
          <Button
            icon={<EditOutlined aria-hidden="true" />}
            onClick={() => {
              onEdit(category)
            }}
            size="small"
          >
            Редактировать
          </Button>
          <DeleteCategoryButton category={category} />
        </Flex>
      ),
      title: 'Действия',
    },
  ]
}
