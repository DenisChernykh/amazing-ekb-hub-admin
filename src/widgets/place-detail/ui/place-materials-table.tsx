import {
  formatMaterialDuration,
  formatMaterialPublishedDate,
  getMaterialPlatformMeta,
  getMaterialTypeMeta,
  getPublicMaterialTitleText,
} from '@/entities/material/ui/material-meta'
import type { MaterialResponseDto } from '@/shared/api'
import type { TableColumnsType } from 'antd'
import { Alert, Button, Empty, Space, Table, Tag } from 'antd'

/**
 * Inline ошибка скрытия связи для одной строки материалов места.
 */
export type PlaceMaterialHideLinkError = {
  materialId: string
  message: string
}

const getPlaceMaterialColumns = ({
  hideLinkError,
  isHideLinkPending,
  onEdit,
  onHideLink,
}: {
  hideLinkError: PlaceMaterialHideLinkError | null
  isHideLinkPending: boolean
  onEdit: (material: MaterialResponseDto) => void
  onHideLink: (material: MaterialResponseDto) => void
}): TableColumnsType<MaterialResponseDto> => [
  {
    dataIndex: 'title',
    key: 'title',
    render: (_value, material) => getPublicMaterialTitleText(material),
    title: 'Материал',
  },
  {
    dataIndex: 'platform',
    key: 'platform',
    render: (platform: MaterialResponseDto['platform']) => {
      const meta = getMaterialPlatformMeta(platform)

      return <Tag color={meta.color}>{meta.label}</Tag>
    },
    title: 'Платформа',
  },
  {
    dataIndex: 'type',
    key: 'type',
    render: (type: MaterialResponseDto['type']) => {
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
    render: (durationSec: MaterialResponseDto['durationSec']) =>
      formatMaterialDuration(durationSec),
    title: 'Длительность',
  },
  {
    key: 'actions',
    render: (_value, material) => {
      const errorMessage =
        hideLinkError?.materialId === material.id ? hideLinkError.message : null

      return (
        <Space orientation="vertical" size={4}>
          <Space size={[4, 4]} wrap>
            <Button onClick={() => onEdit(material)} type="link">
              Редактировать
            </Button>
            <Button
              danger
              disabled={isHideLinkPending}
              onClick={() => {
                onHideLink(material)
              }}
              type="link"
            >
              Скрыть связь
            </Button>
          </Space>
          {errorMessage !== null && (
            <Alert showIcon title={errorMessage} type="error" />
          )}
        </Space>
      )
    },
    title: 'Действия',
  },
]

/**
 * Рендерит bounded список материалов места без владения drawer/query состоянием.
 */
export function PlaceMaterialsTable({
  hideLinkError,
  isHideLinkPending,
  isLoading,
  materials,
  onEdit,
  onHideLink,
}: {
  hideLinkError: PlaceMaterialHideLinkError | null
  isHideLinkPending: boolean
  isLoading: boolean
  materials: MaterialResponseDto[]
  onEdit: (material: MaterialResponseDto) => void
  onHideLink: (material: MaterialResponseDto) => void
}) {
  return (
    <Table
      columns={getPlaceMaterialColumns({
        hideLinkError,
        isHideLinkPending,
        onEdit,
        onHideLink,
      })}
      dataSource={materials}
      loading={isLoading}
      locale={{
        emptyText: <Empty description="Материалов пока нет" />,
      }}
      pagination={false}
      rowKey="id"
    />
  )
}
