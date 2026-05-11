import {
  getMaterialPlatformMeta,
  getMaterialTypeMeta,
} from '@/entities/material/ui/material-meta'
import { useSetPinnedMaterialMutation } from '@/entities/place/model/place-mutations'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { Material } from '@/shared/api/generated/model'
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Flex,
  Select,
  Typography,
} from 'antd'
import { useState } from 'react'
import { toSetPinnedMaterialRequest } from '../model/pinned-material'
import { PinnedMaterialCurrent } from './pinned-material-current'

const getMaterialOptionLabel = (material: Material) => {
  const platform = getMaterialPlatformMeta(material.platform)
  const type = getMaterialTypeMeta(material.type)

  return `${material.title} · ${platform.label} · ${type.label}`
}

/**
 * Props панели выбора закрепленного материала места.
 */
export type PinnedMaterialPanelProps = {
  materials: Material[]
  pinnedMaterial: Material | null
  placeId: string
}

/**
 * Панель назначения закрепленного материала для блока “Начни отсюда”.
 *
 * @remarks Требует AntD `App` provider и React Query provider через entity mutation bridge.
 * Работает только с уже загруженным bounded списком материалов места.
 */
export function PinnedMaterialPanel({
  materials,
  pinnedMaterial,
  placeId,
}: PinnedMaterialPanelProps) {
  const { message } = AntdApp.useApp()
  const initialPinnedMaterialId = pinnedMaterial?.id ?? null
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    initialPinnedMaterialId,
  )
  const [savedMaterialId, setSavedMaterialId] = useState<string | null>(
    initialPinnedMaterialId,
  )
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const setPinnedMaterialMutation = useSetPinnedMaterialMutation({
    onError: (error) => {
      const normalizedError = normalizeApiError(error)
      setErrorMessages(normalizedError.messages)
      void message.error(normalizedError.message)
    },
    onSuccess: (place) => {
      const nextPinnedMaterialId =
        place.pinnedMaterial?.id ?? selectedMaterialId

      setSelectedMaterialId(nextPinnedMaterialId)
      setSavedMaterialId(nextPinnedMaterialId)
      setErrorMessages([])
      void message.success('Материал закреплен')
    },
  })
  const isChanged = selectedMaterialId !== savedMaterialId
  const materialOptions = materials.map((material) => ({
    label: getMaterialOptionLabel(material),
    value: material.id,
  }))

  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterialId(materialId || null)
    setErrorMessages([])
  }

  const handleSubmit = () => {
    const data = toSetPinnedMaterialRequest(selectedMaterialId)

    if (!data) {
      return
    }

    setErrorMessages([])
    setPinnedMaterialMutation.mutate({
      data,
      pathParams: { placeId },
    })
  }

  return (
    <Card title="Закрепленный материал">
      <Flex gap={16} vertical>
        <PinnedMaterialCurrent pinnedMaterial={pinnedMaterial} />

        {Boolean(errorMessages.length) && (
          <Alert
            description={
              <Flex gap={4} vertical>
                {errorMessages.map((errorMessage) => (
                  <Typography.Text key={errorMessage}>
                    {errorMessage}
                  </Typography.Text>
                ))}
              </Flex>
            }
            message="Не удалось закрепить материал"
            showIcon
            type="error"
          />
        )}

        <Select
          aria-label="Материал"
          disabled={!materials.length || setPinnedMaterialMutation.isPending}
          onChange={handleMaterialChange}
          options={materialOptions}
          placeholder="Выберите материал"
          value={selectedMaterialId ?? undefined}
        />

        <Flex justify="end">
          <Button
            disabled={
              !selectedMaterialId ||
              !isChanged ||
              setPinnedMaterialMutation.isPending
            }
            loading={setPinnedMaterialMutation.isPending}
            onClick={handleSubmit}
            type="primary"
          >
            Закрепить
          </Button>
        </Flex>
      </Flex>
    </Card>
  )
}
