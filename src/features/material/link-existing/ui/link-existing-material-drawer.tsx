import { useMaterialLibraryQuery } from '@/entities/material/model/material-library-hooks'
import { useLinkPlaceMaterialMutation } from '@/entities/material/model/material-mutations'
import type { AdminMaterialLibraryResponseDto } from '@/shared/api'
import { isProblemCode } from '@/shared/api/client/api-errors'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { Alert, App as AntdApp, Drawer, Empty, Flex, Typography } from 'antd'
import { useState } from 'react'
import { LinkExistingMaterialTable } from './link-existing-material-table'

const emptyMaterialLibraryResponse = {
  items: [],
}

/**
 * Props drawer-а привязки существующего библиотечного материала к месту.
 */
export type LinkExistingMaterialDrawerProps = {
  onClose: () => void
  open: boolean
  placeId: string
}

/**
 * Drawer-сценарий выбора одобренного материала из общей библиотеки для места.
 *
 * @remarks Загружает material library через entity hook, отправляет связь через
 * entity mutation, скрывает уже активные связи текущего места и требует AntD
 * `App` provider для сообщений об успехе/ошибке.
 */
export function LinkExistingMaterialDrawer({
  onClose,
  open,
  placeId,
}: LinkExistingMaterialDrawerProps) {
  const { message } = AntdApp.useApp()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const materialsQuery = useMaterialLibraryQuery(
    {
      adminStatus: 'approved',
      placeId,
    },
    { enabled: open },
  )
  const linkMaterialMutation = useLinkPlaceMaterialMutation()

  const handleClose = () => {
    if (linkMaterialMutation.isPending) {
      return
    }

    setErrorMessage(null)
    onClose()
  }

  const handleLink = (material: AdminMaterialLibraryResponseDto) => {
    setErrorMessage(null)
    linkMaterialMutation.mutate(
      {
        materialId: material.id,
        placeId,
      },
      {
        onError: (error) => {
          const presentation = getApiErrorPresentation(error)
          const errorMessage = isProblemCode(error, 'MATERIAL_PLACE_NOT_FOUND')
            ? 'Материал места не найден.'
            : isProblemCode(error, 'MATERIAL_NOT_FOUND')
              ? 'Материал не найден.'
              : isProblemCode(error, 'PLACE_NOT_FOUND')
                ? 'Место не найдено.'
                : presentation.message
          setErrorMessage(errorMessage)
          void message.error(errorMessage)
        },
        onSuccess: () => {
          setErrorMessage(null)
          void message.success('Материал связан с местом')
          onClose()
        },
      },
    )
  }

  const data = materialsQuery.data ?? emptyMaterialLibraryResponse
  const linkableMaterials = data.items.filter(
    (material) => material.placeLink !== 'active',
  )

  return (
    <Drawer
      destroyOnHidden
      onClose={handleClose}
      open={open}
      size="large"
      title="Добавить из библиотеки"
    >
      <Flex gap={16} vertical>
        {errorMessage !== null && (
          <Alert showIcon title={errorMessage} type="error" />
        )}

        {materialsQuery.isPending ? (
          <Typography.Text>Загружаем библиотеку материалов</Typography.Text>
        ) : materialsQuery.isError ? (
          <Alert
            showIcon
            title={getApiErrorPresentation(materialsQuery.error).message}
            type="error"
          />
        ) : linkableMaterials.length === 0 ? (
          <Empty description="Подходящих материалов пока нет" />
        ) : (
          <LinkExistingMaterialTable
            isFetching={materialsQuery.isFetching}
            isLinkPending={linkMaterialMutation.isPending}
            materials={linkableMaterials}
            onLink={handleLink}
          />
        )}
      </Flex>
    </Drawer>
  )
}
