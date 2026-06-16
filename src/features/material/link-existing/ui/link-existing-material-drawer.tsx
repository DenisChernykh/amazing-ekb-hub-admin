import { useMaterialLibraryQuery } from '@/entities/material/model/material-library-hooks'
import { useLinkPlaceMaterialMutation } from '@/entities/material/model/material-mutations'
import {
  formatMaterialMediaKind,
  formatMaterialPublishedDate,
  getMaterialAdminStatusMeta,
  getMaterialLibraryPreviewText,
  getMaterialLibrarySourceTitle,
  getMaterialLinkedMeta,
  getMaterialPlatformMeta,
  getSafeMaterialHref,
} from '@/entities/material/ui/material-meta'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { AdminMaterialLibraryItem } from '@/shared/api/generated/model'
import { PictureOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import {
  Alert,
  App as AntdApp,
  Button,
  Drawer,
  Empty,
  Flex,
  Table,
  Tag,
  Typography,
} from 'antd'
import { useState } from 'react'

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

  const handleLink = (material: AdminMaterialLibraryItem) => {
    setErrorMessage(null)
    linkMaterialMutation.mutate(
      {
        materialId: material.id,
        placeId,
      },
      {
        onError: (error) => {
          const apiError = normalizeApiError(error)
          setErrorMessage(apiError.message)
          void message.error(apiError.message)
        },
        onSuccess: () => {
          setErrorMessage(null)
          void message.success('Материал связан с местом')
          onClose()
        },
      },
    )
  }

  const columns: TableColumnsType<AdminMaterialLibraryItem> = [
    {
      dataIndex: 'source',
      key: 'source',
      render: (
        _value: AdminMaterialLibraryItem['source'],
        material: AdminMaterialLibraryItem,
      ) => {
        const platformMeta = getMaterialPlatformMeta(material.platform)
        const sourceHref = getSafeMaterialHref(material.source?.url)

        return (
          <Flex gap={4} vertical>
            {sourceHref ? (
              <Typography.Link
                href={sourceHref}
                rel="noopener noreferrer"
                strong
                target="_blank"
              >
                {getMaterialLibrarySourceTitle(material)}
              </Typography.Link>
            ) : (
              <Typography.Text strong>
                {getMaterialLibrarySourceTitle(material)}
              </Typography.Text>
            )}
            <Tag color={platformMeta.color}>{platformMeta.label}</Tag>
          </Flex>
        )
      },
      title: 'Источник',
    },
    {
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (publishedAt: string) => formatMaterialPublishedDate(publishedAt),
      title: 'Дата',
    },
    {
      key: 'preview',
      render: (_value: unknown, material: AdminMaterialLibraryItem) => {
        const materialHref = getSafeMaterialHref(material.url)
        const previewText = getMaterialLibraryPreviewText(material)

        return (
          <Typography.Paragraph ellipsis={{ rows: 2 }}>
            {materialHref ? (
              <Typography.Link
                href={materialHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                {previewText}
              </Typography.Link>
            ) : (
              previewText
            )}
          </Typography.Paragraph>
        )
      },
      title: 'Текст',
    },
    {
      dataIndex: 'mediaKind',
      key: 'mediaKind',
      render: (
        mediaKind: AdminMaterialLibraryItem['mediaKind'],
        material: AdminMaterialLibraryItem,
      ) => {
        const mediaPreviewHref = getSafeMaterialHref(material.mediaPreviewUrl)

        return (
          <Flex gap={4} vertical>
            <Typography.Text>
              {formatMaterialMediaKind(mediaKind)}
            </Typography.Text>
            {mediaPreviewHref !== null && (
              <Typography.Link
                href={mediaPreviewHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                <PictureOutlined aria-hidden="true" /> Открыть медиа
              </Typography.Link>
            )}
          </Flex>
        )
      },
      title: 'Медиа',
    },
    {
      dataIndex: 'adminStatus',
      key: 'adminStatus',
      render: (status: AdminMaterialLibraryItem['adminStatus']) => {
        const meta = getMaterialAdminStatusMeta(status)

        return <Tag color={meta.color}>{meta.label}</Tag>
      },
      title: 'Статус',
    },
    {
      dataIndex: 'linked',
      key: 'linked',
      render: (linked: AdminMaterialLibraryItem['linked']) => {
        const meta = getMaterialLinkedMeta(linked)

        return <Tag color={meta.color}>{meta.label}</Tag>
      },
      title: 'Связь',
    },
    {
      key: 'actions',
      render: (_value: unknown, material: AdminMaterialLibraryItem) => (
        <Button
          aria-label="Связать"
          disabled={linkMaterialMutation.isPending}
          loading={linkMaterialMutation.isPending}
          onClick={() => {
            handleLink(material)
          }}
          size="small"
          type="primary"
        >
          Связать
        </Button>
      ),
      title: 'Действия',
    },
  ]

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
            title={normalizeApiError(materialsQuery.error).message}
            type="error"
          />
        ) : linkableMaterials.length === 0 ? (
          <Empty description="Подходящих материалов пока нет" />
        ) : (
          <Table
            columns={columns}
            dataSource={linkableMaterials}
            loading={materialsQuery.isFetching}
            pagination={false}
            rowKey="id"
          />
        )}
      </Flex>
    </Drawer>
  )
}
