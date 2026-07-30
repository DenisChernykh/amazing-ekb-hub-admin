import {
  formatMaterialMediaKind,
  getMaterialAdminStatusMeta,
  getMaterialLibraryPreviewText,
  getMaterialLibrarySourceTitle,
  getMaterialLinkedMeta,
  getMaterialPlatformMeta,
  getSafeMaterialHref,
} from '@/entities/material/ui/material-meta'
import type { AdminMaterialLibraryResponseDto } from '@/shared/api'
import { ExportOutlined, PictureOutlined } from '@ant-design/icons'
import { Flex, Tag, Typography } from 'antd'

/**
 * Рендерит источник material library item с safe external link и platform tag.
 */
export function MaterialLibrarySourceCell({
  className,
  material,
}: {
  className?: string
  material: AdminMaterialLibraryResponseDto
}) {
  const platformMeta = getMaterialPlatformMeta(material.platform)
  const sourceHref = getSafeMaterialHref(material.source?.url)
  const title = getMaterialLibrarySourceTitle(material)

  return (
    <Flex className={className} gap={4} vertical>
      {sourceHref ? (
        <Typography.Link
          href={sourceHref}
          rel="noopener noreferrer"
          strong
          target="_blank"
        >
          {title}
        </Typography.Link>
      ) : (
        <Typography.Text strong>{title}</Typography.Text>
      )}
      <Tag color={platformMeta.color}>{platformMeta.label}</Tag>
    </Flex>
  )
}

/**
 * Рендерит preview material library item как plain text или safe external link.
 */
export function MaterialLibraryPreviewCell({
  className,
  linkMode,
  material,
  textClassName,
}: {
  className?: string
  linkMode: 'action' | 'text'
  material: AdminMaterialLibraryResponseDto
  textClassName?: string
}) {
  const materialHref = getSafeMaterialHref(material.url)
  const previewText = getMaterialLibraryPreviewText(material)

  if (linkMode === 'text') {
    return (
      <Typography.Paragraph className={textClassName} ellipsis={{ rows: 2 }}>
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
  }

  return (
    <Flex className={className} gap={4} vertical>
      <Typography.Paragraph className={textClassName} ellipsis={{ rows: 2 }}>
        {previewText}
      </Typography.Paragraph>
      {materialHref !== null && (
        <Typography.Link
          href={materialHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExportOutlined aria-hidden="true" /> Открыть пост
        </Typography.Link>
      )}
    </Flex>
  )
}

/**
 * Рендерит тип медиа и safe link на preview media, если backend вернул его.
 */
export function MaterialLibraryMediaCell({
  material,
}: {
  material: AdminMaterialLibraryResponseDto
}) {
  const mediaPreviewHref = getSafeMaterialHref(material.mediaPreviewUrl)

  return (
    <Flex gap={4} vertical>
      <Typography.Text>
        {formatMaterialMediaKind(material.mediaKind)}
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
}

/**
 * Рендерит localized tag review-статуса material library item.
 */
export function MaterialLibraryAdminStatusTag({
  status,
}: {
  status: AdminMaterialLibraryResponseDto['adminStatus']
}) {
  const meta = getMaterialAdminStatusMeta(status)

  return <Tag color={meta.color}>{meta.label}</Tag>
}

/**
 * Рендерит localized tag состояния связи material library item.
 */
export function MaterialLibraryLinkedTag({
  linked,
}: {
  linked: AdminMaterialLibraryResponseDto['linked']
}) {
  const meta = getMaterialLinkedMeta(linked)

  return <Tag color={meta.color}>{meta.label}</Tag>
}
