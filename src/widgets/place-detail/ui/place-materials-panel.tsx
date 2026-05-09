import { usePlaceMaterialsListQuery } from '@/entities/material/model/material-hooks'
import {
  formatMaterialDuration,
  formatMaterialPublishedDate,
  getMaterialPlatformMeta,
  getMaterialTypeMeta,
} from '@/entities/material/ui/material-meta'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { Material } from '@/shared/api/generated/model'
import type { TableColumnsType } from 'antd'
import { Alert, Card, Empty, Table, Tag, Typography } from 'antd'

const materialColumns: TableColumnsType<Material> = [
  {
    dataIndex: 'title',
    key: 'title',
    render: (_value, material) => (
      <Typography.Link href={material.url} rel="noreferrer" target="_blank">
        {material.title}
      </Typography.Link>
    ),
    title: 'Материал',
  },
  {
    dataIndex: 'platform',
    key: 'platform',
    render: (platform: Material['platform']) => {
      const meta = getMaterialPlatformMeta(platform)

      return <Tag color={meta.color}>{meta.label}</Tag>
    },
    title: 'Платформа',
  },
  {
    dataIndex: 'type',
    key: 'type',
    render: (type: Material['type']) => {
      const meta = getMaterialTypeMeta(type)

      return <Tag color={meta.color}>{meta.label}</Tag>
    },
    title: 'Тип',
  },
  {
    dataIndex: 'publishedAt',
    key: 'publishedAt',
    render: (publishedAt: string) => formatMaterialPublishedDate(publishedAt),
    title: 'Опубликован',
  },
  {
    dataIndex: 'durationSec',
    key: 'durationSec',
    render: (durationSec: Material['durationSec']) =>
      formatMaterialDuration(durationSec),
    title: 'Длительность',
  },
]

/**
 * Props панели материалов места на admin detail screen.
 */
export type PlaceMaterialsPanelProps = {
  placeId: string
}

/**
 * Показывает read-only список материалов места.
 *
 * @remarks Загружает bounded список через admin endpoint, поэтому материалы hidden places доступны в админке.
 */
export function PlaceMaterialsPanel({ placeId }: PlaceMaterialsPanelProps) {
  const materialsQuery = usePlaceMaterialsListQuery(placeId)

  if (materialsQuery.isError) {
    return (
      <Card title="Материалы">
        <Alert
          message={normalizeApiError(materialsQuery.error).message}
          showIcon
          type="error"
        />
      </Card>
    )
  }

  const materials = materialsQuery.data?.items ?? []

  return (
    <Card title="Материалы">
      <Table
        columns={materialColumns}
        dataSource={materials}
        loading={materialsQuery.isPending || materialsQuery.isFetching}
        locale={{
          emptyText: <Empty description="Материалов пока нет" />,
        }}
        pagination={false}
        rowKey="id"
      />
    </Card>
  )
}
