import {
  getMaterialPlatformMeta,
  getMaterialTypeMeta,
} from '@/entities/material/ui/material-meta'
import {
  useClearPinnedMaterialMutation,
  useSetPinnedMaterialMutation,
} from '@/entities/place/model/place-mutations'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { PublicMaterial } from '@/shared/api/generated/model'
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

const getMaterialOptionLabel = (material: PublicMaterial) => {
  const platform = getMaterialPlatformMeta(material.platform)
  const type = getMaterialTypeMeta(material.type)

  return `${material.title} · ${platform.label} · ${type.label}`
}

/**
 * Props панели выбора закрепленного материала места.
 */
export type PinnedMaterialPanelProps = {
  materials: PublicMaterial[]
  pinnedMaterial: PublicMaterial | null
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
  const [errorTitle, setErrorTitle] = useState('Не удалось закрепить материал')
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const setPinnedMaterialMutation = useSetPinnedMaterialMutation({
    onError: (error) => {
      const normalizedError = normalizeApiError(error)
      setErrorTitle('Не удалось закрепить материал')
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
  const clearPinnedMaterialMutation = useClearPinnedMaterialMutation({
    onError: (error) => {
      const normalizedError = normalizeApiError(error)
      setErrorTitle('Не удалось снять закрепление')
      setErrorMessages(normalizedError.messages)
      void message.error(normalizedError.message)
    },
    onSuccess: () => {
      setSelectedMaterialId(null)
      setSavedMaterialId(null)
      setErrorMessages([])
      void message.success('Закрепление снято')
    },
  })
  const isChanged = selectedMaterialId !== savedMaterialId
  const isMutationPending =
    setPinnedMaterialMutation.isPending || clearPinnedMaterialMutation.isPending
  const materialOptions = materials.map((material) => ({
    label: getMaterialOptionLabel(material),
    value: material.id,
  }))

  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterialId(materialId || null)
    setErrorMessages([])
  }

  const handleClear = () => {
    setErrorMessages([])
    clearPinnedMaterialMutation.mutate({
      pathParams: { placeId },
    })
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
            message={errorTitle}
            showIcon
            type="error"
          />
        )}

        <Select
          aria-label="Материал"
          disabled={!materials.length || isMutationPending}
          onChange={handleMaterialChange}
          options={materialOptions}
          placeholder="Выберите материал"
          value={selectedMaterialId ?? undefined}
        />

        <Flex gap={8} justify="end" wrap>
          {Boolean(pinnedMaterial) && (
            <Button
              disabled={isMutationPending}
              loading={clearPinnedMaterialMutation.isPending}
              onClick={handleClear}
            >
              Снять закрепление
            </Button>
          )}
          <Button
            disabled={!selectedMaterialId || !isChanged || isMutationPending}
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
