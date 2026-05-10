import { usePlaceMaterialsListQuery } from '@/entities/material/model/material-hooks'
import {
  formatMaterialDuration,
  formatMaterialPublishedDate,
  getMaterialPlatformMeta,
  getMaterialTypeMeta,
} from '@/entities/material/ui/material-meta'
import { CreateMaterialDrawer } from '@/features/material/create/ui/create-material-drawer'
import { EditMaterialDrawer } from '@/features/material/edit/ui/edit-material-drawer'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { Material } from '@/shared/api/generated/model'
import type { TableColumnsType } from 'antd'
import { Alert, Button, Card, Empty, Table, Tag, Typography } from 'antd'
import { useState } from 'react'

const getMaterialColumns = (
  onEdit: (material: Material) => void,
): TableColumnsType<Material> => [
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
  {
    key: 'actions',
    render: (_value, material) => (
      <Button onClick={() => onEdit(material)} type="link">
        Редактировать
      </Button>
    ),
    title: 'Действия',
  },
]

/**
 * Props панели материалов места на admin detail screen.
 */
export type PlaceMaterialsPanelProps = {
  placeId: string
}

/**
 * Показывает bounded список материалов места с create/edit drawer actions.
 *
 * @remarks Загружает bounded список через admin endpoint, поэтому материалы hidden places доступны в админке.
 */
export function PlaceMaterialsPanel({ placeId }: PlaceMaterialsPanelProps) {
  const materialsQuery = usePlaceMaterialsListQuery(placeId)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const addButton = (
    <Button
      onClick={() => {
        setIsCreateOpen(true)
      }}
      type="primary"
    >
      Добавить материал
    </Button>
  )

  if (materialsQuery.isError) {
    return (
      <>
        <Card extra={addButton} title="Материалы">
          <Alert
            message={normalizeApiError(materialsQuery.error).message}
            showIcon
            type="error"
          />
        </Card>
        <CreateMaterialDrawer
          key={`create:${placeId}`}
          onClose={() => {
            setIsCreateOpen(false)
          }}
          open={isCreateOpen}
          placeId={placeId}
        />
      </>
    )
  }

  const materials = materialsQuery.data?.items ?? []

  return (
    <>
      <Card extra={addButton} title="Материалы">
        <Table
          columns={getMaterialColumns(setEditingMaterial)}
          dataSource={materials}
          loading={materialsQuery.isPending || materialsQuery.isFetching}
          locale={{
            emptyText: <Empty description="Материалов пока нет" />,
          }}
          pagination={false}
          rowKey="id"
        />
      </Card>
      <CreateMaterialDrawer
        key={`create:${placeId}`}
        onClose={() => {
          setIsCreateOpen(false)
        }}
        open={isCreateOpen}
        placeId={placeId}
      />
      {editingMaterial && (
        <EditMaterialDrawer
          key={editingMaterial.id}
          material={editingMaterial}
          onClose={() => {
            setEditingMaterial(null)
          }}
          open={Boolean(editingMaterial)}
          placeId={placeId}
        />
      )}
    </>
  )
}
