import { PlaceCategoryTag } from '@/entities/place/ui/place-category-tag'
import { PlaceStatusTag } from '@/entities/place/ui/place-status-tag'
import type { AdminPlaceSummaryResponseDto } from '@/shared/api'
import { Space, Tag, Typography, type TableProps } from 'antd'
import { Link } from 'react-router'

/**
 * Колонки таблицы мест для read-only admin списка.
 */
export const placesTableColumns: TableProps<AdminPlaceSummaryResponseDto>['columns'] =
  [
    {
      dataIndex: 'title',
      key: 'title',
      render: (title: AdminPlaceSummaryResponseDto['title'], place) => (
        <Link to={`/places/${place.id}`}>
          <Typography.Text strong>{title}</Typography.Text>
        </Link>
      ),
      title: 'Название',
    },
    {
      dataIndex: 'category',
      key: 'category',
      render: (category: AdminPlaceSummaryResponseDto['category']) => (
        <PlaceCategoryTag category={category} />
      ),
      title: 'Категория',
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: AdminPlaceSummaryResponseDto['status']) => (
        <PlaceStatusTag status={status} />
      ),
      title: 'Статус',
    },
    {
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: AdminPlaceSummaryResponseDto['tags']) => (
        <Space size={[4, 4]} wrap>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
      title: 'Теги',
    },
  ]
