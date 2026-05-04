import { PlaceCategoryTag } from '@/entities/place/ui/place-category-tag'
import { PlaceStatusTag } from '@/entities/place/ui/place-status-tag'
import type { PlaceSummary } from '@/shared/api/generated/model'
import { Space, Tag, Typography, type TableProps } from 'antd'

/**
 * Колонки таблицы мест для read-only admin списка.
 */
export const placesTableColumns: TableProps<PlaceSummary>['columns'] = [
  {
    dataIndex: 'title',
    key: 'title',
    render: (title: PlaceSummary['title']) => (
      <Typography.Text strong>{title}</Typography.Text>
    ),
    title: 'Название',
  },
  {
    dataIndex: 'category',
    key: 'category',
    render: (category: PlaceSummary['category']) => (
      <PlaceCategoryTag category={category} />
    ),
    title: 'Категория',
  },
  {
    dataIndex: 'status',
    key: 'status',
    render: (status: PlaceSummary['status']) => (
      <PlaceStatusTag status={status} />
    ),
    title: 'Статус',
  },
  {
    dataIndex: 'tags',
    key: 'tags',
    render: (tags: PlaceSummary['tags']) => (
      <Space size={[4, 4]} wrap>
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </Space>
    ),
    title: 'Теги',
  },
  {
    align: 'right',
    dataIndex: 'popularityWeight',
    key: 'popularityWeight',
    title: 'Вес',
  },
]
