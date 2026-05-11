import {
  getMaterialPlatformMeta,
  getMaterialTypeMeta,
} from '@/entities/material/ui/material-meta'
import type { Material } from '@/shared/api/generated/model'
import { Flex, Space, Tag, Typography } from 'antd'

type PinnedMaterialCurrentProps = {
  pinnedMaterial: Material | null
}

/**
 * Компактно показывает текущий закрепленный материал места.
 */
export function PinnedMaterialCurrent({
  pinnedMaterial,
}: PinnedMaterialCurrentProps) {
  return (
    <Flex align="center" gap={8} wrap>
      <Typography.Text type="secondary">Текущий:</Typography.Text>
      {pinnedMaterial ? (
        <Space size={[4, 4]} wrap>
          <Typography.Text strong>{pinnedMaterial.title}</Typography.Text>
          <Tag color={getMaterialPlatformMeta(pinnedMaterial.platform).color}>
            {getMaterialPlatformMeta(pinnedMaterial.platform).label}
          </Tag>
          <Tag color={getMaterialTypeMeta(pinnedMaterial.type).color}>
            {getMaterialTypeMeta(pinnedMaterial.type).label}
          </Tag>
        </Space>
      ) : (
        <Typography.Text>Материал не закреплен</Typography.Text>
      )}
    </Flex>
  )
}
