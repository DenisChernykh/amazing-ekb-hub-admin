import {
  getMaterialPlatformMeta,
  getMaterialTypeMeta,
  getPublicMaterialTitleText,
} from '@/entities/material/ui/material-meta'
import {
  useClearPinnedMaterialMutation,
  useSetPinnedMaterialMutation,
} from '@/entities/place/model/place-mutations'
import type {
  MaterialResponseDto,
  PinnedMaterialResponseDto,
} from '@/shared/api'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { App as AntdApp, Card, Flex, Select } from 'antd'
import { useState } from 'react'
import { toSetPinnedMaterialRequest } from '../model/pinned-material'
import { PinnedMaterialActions } from './pinned-material-actions'
import { PinnedMaterialCurrent } from './pinned-material-current'
import { PinnedMaterialErrorAlert } from './pinned-material-error-alert'

const getMaterialOptionLabel = (material: MaterialResponseDto) => {
  const platform = getMaterialPlatformMeta(material.platform)
  const type = getMaterialTypeMeta(material.type)

  return `${getPublicMaterialTitleText(material)} · ${platform.label} · ${type.label}`
}

/**
 * Props панели выбора закрепленного материала места.
 */
export type PinnedMaterialPanelProps = {
  materials: MaterialResponseDto[]
  pinnedMaterial: PinnedMaterialResponseDto | null
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
          <PinnedMaterialErrorAlert
            messages={errorMessages}
            title={errorTitle}
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

        <PinnedMaterialActions
          canSubmit={Boolean(selectedMaterialId) && isChanged}
          hasPinnedMaterial={pinnedMaterial !== null}
          isClearPending={clearPinnedMaterialMutation.isPending}
          isMutationPending={isMutationPending}
          isSetPending={setPinnedMaterialMutation.isPending}
          onClear={handleClear}
          onSubmit={handleSubmit}
        />
      </Flex>
    </Card>
  )
}
