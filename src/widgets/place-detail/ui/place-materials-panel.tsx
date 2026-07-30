import { usePlaceMaterialsListQuery } from '@/entities/material/model/material-hooks'
import { useHidePlaceMaterialLinkMutation } from '@/entities/material/model/material-mutations'
import { CreateMaterialDrawer } from '@/features/material/create/ui/create-material-drawer'
import { EditMaterialDrawer } from '@/features/material/edit/ui/edit-material-drawer'
import { LinkExistingMaterialDrawer } from '@/features/material/link-existing/ui/link-existing-material-drawer'
import { PinnedMaterialPanel } from '@/features/place/pinned-material/ui/pinned-material-panel'
import type {
  MaterialResponseDto,
  PinnedMaterialResponseDto,
} from '@/shared/api'
import { isProblemCode } from '@/shared/api/client/api-errors'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { Alert, App as AntdApp, Button, Card, Space } from 'antd'
import { useState } from 'react'
import {
  PlaceMaterialsTable,
  type PlaceMaterialHideLinkError,
} from './place-materials-table'

/**
 * Props панели материалов места на admin detail screen.
 */
export type PlaceMaterialsPanelProps = {
  pinnedMaterial: PinnedMaterialResponseDto | null
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
  const [editingMaterial, setEditingMaterial] =
    useState<MaterialResponseDto | null>(null)
  const [hideLinkError, setHideLinkError] =
    useState<PlaceMaterialHideLinkError | null>(null)
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

  const handleHideLink = (material: MaterialResponseDto) => {
    setHideLinkError(null)
    hideLinkMutation.mutate(
      {
        materialId: material.id,
        placeId,
      },
      {
        onError: (error) => {
          const presentation = getApiErrorPresentation(error)
          const errorMessage = isProblemCode(
            error,
            'PLACE_MATERIAL_LINK_NOT_FOUND',
          )
            ? 'Связь материала с местом не найдена.'
            : isProblemCode(error, 'MATERIAL_PLACE_NOT_FOUND')
              ? 'Материал места не найден.'
              : presentation.message
          setHideLinkError({
            materialId: material.id,
            message: errorMessage,
          })
          void message.error(errorMessage)
        },
        onSuccess: () => {
          setHideLinkError(null)
          void message.success('Связь скрыта')
        },
      },
    )
  }

  const materials = materialsQuery.isError
    ? []
    : (materialsQuery.data?.items ?? [])
  const materialsContent = materialsQuery.isError ? (
    <Alert
      showIcon
      title={
        isProblemCode(materialsQuery.error, 'MATERIAL_PLACE_NOT_FOUND')
          ? 'Материал места не найден.'
          : getApiErrorPresentation(materialsQuery.error).message
      }
      type="error"
    />
  ) : (
    <PlaceMaterialsTable
      hideLinkError={hideLinkError}
      isHideLinkPending={hideLinkMutation.isPending}
      isLoading={materialsQuery.isPending || materialsQuery.isFetching}
      materials={materials}
      onEdit={setEditingMaterial}
      onHideLink={handleHideLink}
    />
  )

  return (
    <>
      <PinnedMaterialPanel
        key={`pinned:${placeId}:${pinnedMaterial?.id ?? 'none'}`}
        materials={materials}
        pinnedMaterial={pinnedMaterial}
        placeId={placeId}
      />
      <Card extra={addButton} title="Материалы">
        {materialsContent}
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
