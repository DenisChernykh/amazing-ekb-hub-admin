import { CategoryColorSwatch } from '@/entities/category/ui/category-color-swatch'
import { formatCategoryDateTime } from '@/entities/category/ui/category-meta'
import { DeleteCategoryButton } from '@/features/category/delete/ui/delete-category-button'
import type { AdminPlaceCategory } from '@/shared/api/generated/model'
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
  onEdit: (category: AdminPlaceCategory) => void
}): TableColumnsType<AdminPlaceCategory> {
  return [
    {
      dataIndex: 'title',
      key: 'title',
      render: (
        title: AdminPlaceCategory['title'],
        category: AdminPlaceCategory,
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
      render: (slug: AdminPlaceCategory['slug']) => (
        <Typography.Text code>{slug}</Typography.Text>
      ),
      title: 'Ярлык',
    },
    {
      dataIndex: 'badgeBackgroundColor',
      key: 'badgeBackgroundColor',
      render: (color: AdminPlaceCategory['badgeBackgroundColor']) => (
        <CategoryColorSwatch color={color} />
      ),
      title: 'Цвет бейджа',
    },
    {
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: AdminPlaceCategory['updatedAt']) =>
        formatCategoryDateTime(value),
      title: 'Обновлена',
    },
    {
      key: 'actions',
      render: (_value: unknown, category: AdminPlaceCategory) => (
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
