import { useAppDispatch, useAppSelector } from '@/app/store-hooks'
import { Alert, Button, Space } from 'antd'
import { useState } from 'react'
import {
  clearBulkModerationDraftSelection,
  getRestorableBulkModerationDraftPlaces,
  readBulkModerationDraftSelection,
  saveBulkModerationDraftSelection,
} from '../model/bulk-moderation-draft-storage'
import {
  bulkModerationActions,
  selectBulkModerationSelectedCount,
  type BulkModerationSelectedPlace,
} from '../model/bulk-moderation-slice'

type BulkModerationDraftRestorePromptProps = {
  loadedPlaces: BulkModerationSelectedPlace[]
}

/**
 * Показывает non-blocking prompt восстановления черновика выбора мест.
 *
 * @remarks Синхронизируется с внешним `sessionStorage` и восстанавливает только места из текущего загруженного списка.
 */
export function BulkModerationDraftRestorePrompt({
  loadedPlaces,
}: BulkModerationDraftRestorePromptProps) {
  const dispatch = useAppDispatch()
  const selectedCount = useAppSelector(selectBulkModerationSelectedCount)
  const [draft, setDraft] = useState(() => readBulkModerationDraftSelection())

  if (!draft || selectedCount > 0) {
    return null
  }

  const handleRestore = () => {
    const freshDraft = readBulkModerationDraftSelection()

    if (!freshDraft) {
      setDraft(null)
      return
    }

    const freshRestorablePlaces = getRestorableBulkModerationDraftPlaces(
      freshDraft,
      loadedPlaces,
    )

    if (freshRestorablePlaces.length > 0) {
      dispatch(
        bulkModerationActions.restoreDraftSelection(freshRestorablePlaces),
      )
      saveBulkModerationDraftSelection(freshRestorablePlaces)
    } else {
      clearBulkModerationDraftSelection()
    }

    setDraft(null)
  }

  const handleClear = () => {
    clearBulkModerationDraftSelection()
    setDraft(null)
  }

  return (
    <Alert
      action={
        <Space>
          <Button onClick={handleRestore} size="small" type="primary">
            Восстановить
          </Button>
          <Button onClick={handleClear} size="small">
            Сбросить
          </Button>
        </Space>
      }
      description="Будут восстановлены только места, которые есть в текущем загруженном списке."
      showIcon
      title="Есть сохраненный черновик выбора"
      type="info"
    />
  )
}
