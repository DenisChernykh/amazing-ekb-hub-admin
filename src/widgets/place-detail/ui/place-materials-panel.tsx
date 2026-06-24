import { usePlaceMaterialsListQuery } from '@/entities/material/model/material-hooks'
import { useHidePlaceMaterialLinkMutation } from '@/entities/material/model/material-mutations'
import {
  formatMaterialDuration,
  formatMaterialPublishedDate,
  getMaterialPlatformMeta,
  getMaterialTypeMeta,
} from '@/entities/material/ui/material-meta'
import { CreateMaterialDrawer } from '@/features/material/create/ui/create-material-drawer'
import { EditMaterialDrawer } from '@/features/material/edit/ui/edit-material-drawer'
import { LinkExistingMaterialDrawer } from '@/features/material/link-existing/ui/link-existing-material-drawer'
import { PinnedMaterialPanel } from '@/features/place/pinned-material/ui/pinned-material-panel'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { PublicMaterial } from '@/shared/api/generated/model'
import type { TableColumnsType } from 'antd'
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Empty,
  Space,
  Table,
  Tag,
} from 'antd'
import { useState } from 'react'

type HideLinkError = {
  materialId: string
  message: string
}

type MaterialColumnsOptions = {
  hideLinkError: HideLinkError | null
  isHideLinkPending: boolean
  onEdit: (material: PublicMaterial) => void
  onHideLink: (material: PublicMaterial) => void
}

const getMaterialColumns = ({
  hideLinkError,
  isHideLinkPending,
  onEdit,
  onHideLink,
}: MaterialColumnsOptions): TableColumnsType<PublicMaterial> => [
  {
    dataIndex: 'title',
    key: 'title',
    render: (_value, material) => material.title,
    title: 'Материал',
  },
  {
    dataIndex: 'platform',
    key: 'platform',
    render: (platform: PublicMaterial['platform']) => {
      const meta = getMaterialPlatformMeta(platform)

      return <Tag color={meta.color}>{meta.label}</Tag>
    },
    title: 'Платформа',
  },
  {
    dataIndex: 'type',
    key: 'type',
    render: (type: PublicMaterial['type']) => {
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
    render: (durationSec: PublicMaterial['durationSec']) =>
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
 * Props панели материалов места на admin detail screen.
 */
export type PlaceMaterialsPanelProps = {
  pinnedMaterial: PublicMaterial | null
  placeId: string
}

/**
 * Показывает selector закрепленного материала и bounded список материалов места с create/edit/link/hide actions.
 *
 * @remarks Загружает bounded список через admin endpoint, поэтому материалы hidden places доступны в админке.
 */
export function PlaceMaterialsPanel({
  pinnedMaterial,
  placeId,
}: PlaceMaterialsPanelProps) {
  const { message } = AntdApp.useApp()
  const materialsQuery = usePlaceMaterialsListQuery(placeId)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLinkExistingOpen, setIsLinkExistingOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<PublicMaterial | null>(
    null,
  )
  const [hideLinkError, setHideLinkError] = useState<HideLinkError | null>(null)
  const hideLinkMutation = useHidePlaceMaterialLinkMutation()
  const addButton = (
    <Space size={[8, 8]} wrap>
      <Button
        onClick={() => {
          setIsLinkExistingOpen(true)
        }}
      >
        Добавить из библиотеки
      </Button>
      <Button
        onClick={() => {
          setIsCreateOpen(true)
        }}
        type="primary"
      >
        Добавить материал
      </Button>
    </Space>
  )

  const handleHideLink = (material: PublicMaterial) => {
    setHideLinkError(null)
    hideLinkMutation.mutate(
      {
        materialId: material.id,
        placeId,
      },
      {
        onError: (error) => {
          const apiError = normalizeApiError(error)
          setHideLinkError({
            materialId: material.id,
            message: apiError.message,
          })
          void message.error(apiError.message)
        },
        onSuccess: () => {
          setHideLinkError(null)
          void message.success('Связь скрыта')
        },
      },
    )
  }

  if (materialsQuery.isError) {
    return (
      <>
        <PinnedMaterialPanel
          key={`pinned:${placeId}:${pinnedMaterial?.id ?? 'none'}`}
          materials={[]}
          pinnedMaterial={pinnedMaterial}
          placeId={placeId}
        />
        <Card extra={addButton} title="Материалы">
          <Alert
            showIcon
            title={normalizeApiError(materialsQuery.error).message}
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
        <LinkExistingMaterialDrawer
          key={`link-existing:${placeId}`}
          onClose={() => {
            setIsLinkExistingOpen(false)
          }}
          open={isLinkExistingOpen}
          placeId={placeId}
        />
      </>
    )
  }

  const materials = materialsQuery.data?.items ?? []

  return (
    <>
      <PinnedMaterialPanel
        key={`pinned:${placeId}:${pinnedMaterial?.id ?? 'none'}`}
        materials={materials}
        pinnedMaterial={pinnedMaterial}
        placeId={placeId}
      />
      <Card extra={addButton} title="Материалы">
        <Table
          columns={getMaterialColumns({
            hideLinkError,
            isHideLinkPending: hideLinkMutation.isPending,
            onEdit: setEditingMaterial,
            onHideLink: handleHideLink,
          })}
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
      <LinkExistingMaterialDrawer
        key={`link-existing:${placeId}`}
        onClose={() => {
          setIsLinkExistingOpen(false)
        }}
        open={isLinkExistingOpen}
        placeId={placeId}
      />
      {editingMaterial !== null && (
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
