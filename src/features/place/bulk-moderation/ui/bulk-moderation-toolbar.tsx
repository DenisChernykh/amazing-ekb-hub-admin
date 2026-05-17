import { useAppDispatch, useAppSelector } from '@/app/store-hooks'
import { useUpdatePlaceStatusMutation } from '@/entities/place/model/place-mutations'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { PlaceStatus } from '@/shared/api/generated/model'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Flex, Typography } from 'antd'
import {
  bulkModerationActions,
  selectBulkModerationFailedItems,
  selectBulkModerationIsRunning,
  selectBulkModerationSelectedCount,
  selectBulkModerationSelectedPlaces,
  selectBulkModerationSucceededItems,
  type BulkModerationSelectedPlace,
} from '../model/bulk-moderation-slice'
import { BulkModerationProgressDrawer } from './bulk-moderation-progress-drawer'

type BulkModerationTask = Pick<BulkModerationSelectedPlace, 'id' | 'title'> & {
  targetStatus: PlaceStatus
}

/**
 * Toolbar массовой публикации или скрытия выбранных мест.
 *
 * @remarks Использует Redux только для локального workflow-state, а API вызывает через entity mutation bridge.
 */
export function BulkModerationToolbar() {
  const dispatch = useAppDispatch()
  const { message } = AntdApp.useApp()
  const selectedCount = useAppSelector(selectBulkModerationSelectedCount)
  const selectedPlaces = useAppSelector(selectBulkModerationSelectedPlaces)
  const failedItems = useAppSelector(selectBulkModerationFailedItems)
  const succeededItems = useAppSelector(selectBulkModerationSucceededItems)
  const isRunning = useAppSelector(selectBulkModerationIsRunning)
  const updateStatusMutation = useUpdatePlaceStatusMutation()

  const runTasks = async (tasks: BulkModerationTask[]) => {
    let failedCount = 0

    for (const task of tasks) {
      dispatch(bulkModerationActions.markItemPending(task.id))

      try {
        await updateStatusMutation.mutateAsync({
          data: { status: task.targetStatus },
          pathParams: { placeId: task.id },
        })
        dispatch(bulkModerationActions.markItemSucceeded(task.id))
      } catch (error) {
        failedCount += 1
        dispatch(
          bulkModerationActions.markItemFailed({
            errorMessage: normalizeApiError(error).message,
            placeId: task.id,
          }),
        )
      }
    }

    dispatch(bulkModerationActions.finishOperation())

    if (failedCount > 0) {
      void message.warning('Часть мест не удалось обновить')
      return
    }

    void message.success('Массовая модерация завершена')
  }

  const handleStart = (targetStatus: PlaceStatus) => {
    if (selectedPlaces.length === 0) {
      return
    }

    dispatch(bulkModerationActions.startBulkOperation({ targetStatus }))
    void runTasks(
      selectedPlaces.map((place) => ({
        ...place,
        targetStatus,
      })),
    )
  }

  const handleRetryFailed = () => {
    dispatch(bulkModerationActions.retryFailedItems())
    void runTasks(
      failedItems.map((item) => ({
        ...item,
        targetStatus: item.targetStatus,
      })),
    )
  }

  const handleUndoSucceeded = () => {
    dispatch(bulkModerationActions.startUndoOperation())
    void runTasks(
      succeededItems.map((item) => ({
        ...item,
        targetStatus: item.previousStatus,
      })),
    )
  }

  return (
    <>
      <Flex align="center" gap={8} justify="space-between" wrap>
        <Typography.Text strong>Выбрано: {selectedCount}</Typography.Text>

        <Flex gap={8} wrap>
          <Button
            disabled={selectedCount === 0 || isRunning}
            icon={<EyeOutlined aria-hidden="true" />}
            onClick={() => handleStart('active')}
          >
            Опубликовать
          </Button>
          <Button
            disabled={selectedCount === 0 || isRunning}
            icon={<EyeInvisibleOutlined aria-hidden="true" />}
            onClick={() => handleStart('hidden')}
            type="primary"
          >
            Скрыть
          </Button>
          <Button
            disabled={selectedCount === 0 || isRunning}
            onClick={() =>
              dispatch(bulkModerationActions.resetBulkModeration())
            }
          >
            Сбросить
          </Button>
        </Flex>
      </Flex>

      <BulkModerationProgressDrawer
        onRetryFailed={handleRetryFailed}
        onUndoSucceeded={handleUndoSucceeded}
      />
    </>
  )
}
