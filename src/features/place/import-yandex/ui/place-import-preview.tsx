import { CategoryStatusTag } from '@/entities/category/ui/category-status-tag'
import type { PlaceImportOperationResponseDto } from '@/shared/api'
import { Alert, Descriptions, Flex, Typography } from 'antd'
import { Link } from 'react-router'

const categoryResolutionLabel = {
  created: 'Создана импортом',
  existing: 'Существующая категория',
  will_create: 'Будет создан черновик',
} as const

/** Read-only preview данных, которые backend атомарно применит при confirm. */
export function PlaceImportPreview({
  operation,
}: {
  operation: PlaceImportOperationResponseDto
}) {
  const category = operation.category

  return (
    <Flex gap={16} vertical>
      {operation.possibleDuplicate && (
        <Alert
          action={
            <Link to={`/places/${operation.possibleDuplicate.placeId}`}>
              Открыть место
            </Link>
          }
          description={`Похожее место: ${operation.possibleDuplicate.title}. Это предупреждение не блокирует подтверждение.`}
          showIcon
          title="Возможный дубликат"
          type="warning"
        />
      )}

      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Название">
          {operation.title ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Яндекс Карты">
          {operation.mapsUrl ? (
            <Typography.Link
              href={operation.mapsUrl}
              rel="noreferrer"
              target="_blank"
            >
              Открыть карточку
            </Typography.Link>
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Organization ID">
          <Typography.Text code>
            {operation.organizationId ?? '—'}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Категория">
          {category ? (
            <Flex align="center" gap={8} wrap>
              <Typography.Text>{category.title}</Typography.Text>
              {category.status ? (
                <CategoryStatusTag status={category.status} />
              ) : (
                <Typography.Text type="secondary">
                  Новая категория
                </Typography.Text>
              )}
              <Typography.Text type="secondary">
                {categoryResolutionLabel[category.resolution]}
              </Typography.Text>
            </Flex>
          ) : (
            '—'
          )}
        </Descriptions.Item>
      </Descriptions>
    </Flex>
  )
}
