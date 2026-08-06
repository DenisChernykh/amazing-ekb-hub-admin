import { PlaceCategoryTag } from '@/entities/place/ui/place-category-tag'
import { PlaceStatusTag } from '@/entities/place/ui/place-status-tag'
import { PlaceCollectionsAssignment } from '@/features/place/collections/ui/place-collections-assignment'
import type {
  AdminCollectionSummaryResponseDto,
  AdminPlaceSummaryResponseDto,
} from '@/shared/api'
import { Space, Tag, Typography, type TableProps } from 'antd'
import { Link } from 'react-router'

/**
 * Колонки таблицы мест для read-only admin списка.
 */
/** Создаёт колонки places table с entity-backed inline collections assignment. */
export function getPlacesTableColumns(
  collections: AdminCollectionSummaryResponseDto[] = [],
): TableProps<AdminPlaceSummaryResponseDto>['columns'] {
  return [
    {
      key: 'collections',
      render: (_value, place) => (
        <PlaceCollectionsAssignment collections={collections} place={place} />
      ),
      title: 'Подборки',
    },
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
}

/** Backwards-compatible default columns for consumers without collection options. */
export const placesTableColumns = getPlacesTableColumns()
