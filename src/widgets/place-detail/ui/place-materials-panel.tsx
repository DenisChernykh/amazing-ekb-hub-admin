import { usePlaceMaterialsListQuery } from '@/entities/material/model/material-hooks'
import {
  formatMaterialDuration,
  formatMaterialPublishedDate,
  getMaterialPlatformMeta,
  getMaterialTypeMeta,
} from '@/entities/material/ui/material-meta'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { Material, PlaceStatus } from '@/shared/api/generated/model'
import type { TableColumnsType } from 'antd'
import { Alert, Card, Empty, Table, Tag, Typography } from 'antd'

const MATERIALS_BRIDGE_PAGE = 1
const MATERIALS_BRIDGE_PAGE_SIZE = 100

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
  placeStatus: PlaceStatus
}

/**
 * Показывает read-only список материалов места.
 *
 * @remarks Для `hidden` places запрос отключается, потому что текущий backend read endpoint материалов публичный и доступен только для `active` places.
 */
export function PlaceMaterialsPanel({
  placeId,
  placeStatus,
}: PlaceMaterialsPanelProps) {
  const isMaterialsQueryEnabled = placeStatus === 'active'
  const materialsQuery = usePlaceMaterialsListQuery(
    placeId,
    {
      page: MATERIALS_BRIDGE_PAGE,
      pageSize: MATERIALS_BRIDGE_PAGE_SIZE,
    },
    { enabled: isMaterialsQueryEnabled },
  )

  if (!isMaterialsQueryEnabled) {
    return (
      <Card title="Материалы">
        <Alert
          message="Материалы скрытого места пока недоступны в админке: backend отдает список материалов только для опубликованных мест."
          showIcon
          type="warning"
        />
      </Card>
    )
  }

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
