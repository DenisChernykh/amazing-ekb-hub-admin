import { useAppDispatch, useAppSelector } from '@/app/store-hooks'
import { PlaceStatusTag } from '@/entities/place/ui/place-status-tag'
import {
  bulkModerationActions,
  selectBulkModerationFailedItems,
  selectBulkModerationIsRunning,
  selectBulkModerationQueueItems,
  selectBulkModerationSucceededItems,
  type BulkModerationQueueItemStatus,
} from '@/features/place/bulk-moderation/model/bulk-moderation-slice'
import { Button, Drawer, Flex, List, Space, Tag, Typography } from 'antd'

const statusLabel: Record<BulkModerationQueueItemStatus, string> = {
  failed: 'Ошибка',
  pending: 'В работе',
  queued: 'В очереди',
  succeeded: 'Успешно',
}

const statusColor: Record<BulkModerationQueueItemStatus, string> = {
  failed: 'error',
  pending: 'processing',
  queued: 'default',
  succeeded: 'success',
}

type BulkModerationProgressDrawerProps = {
  onRetryFailed: () => void
  onUndoSucceeded: () => void
}

/**
 * Drawer прогресса локальной очереди bulk moderation.
 *
 * @remarks Показывает только Redux workflow-state; серверные данные остаются в React Query.
 */
export function BulkModerationProgressDrawer({
  onRetryFailed,
  onUndoSucceeded,
}: BulkModerationProgressDrawerProps) {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectBulkModerationQueueItems)
  const failedItems = useAppSelector(selectBulkModerationFailedItems)
  const succeededItems = useAppSelector(selectBulkModerationSucceededItems)
  const isRunning = useAppSelector(selectBulkModerationIsRunning)
  const pendingCount = items.filter(
    (item) => item.operationStatus === 'pending',
  ).length
  const queuedCount = items.filter(
    (item) => item.operationStatus === 'queued',
  ).length
  const handleReset = () => {
    if (!isRunning) {
      dispatch(bulkModerationActions.resetBulkModeration())
    }
  }

  return (
    <Drawer
      closable={!isRunning}
      extra={
        <Button disabled={isRunning} onClick={handleReset}>
          Сбросить
        </Button>
      }
      maskClosable={!isRunning}
      onClose={handleReset}
      open={items.length > 0}
      title="Массовая модерация"
      width={460}
    >
      <Flex gap={16} vertical>
        <Space size={[8, 8]} wrap>
          <Tag color="success">Успешно: {succeededItems.length}</Tag>
          <Tag color="error">Ошибок: {failedItems.length}</Tag>
          <Tag>В очереди: {queuedCount}</Tag>
          <Tag color="processing">В работе: {pendingCount}</Tag>
        </Space>

        <List
          dataSource={items}
          renderItem={(item) => (
            <List.Item>
              <Flex gap={8} vertical>
                <Flex align="center" gap={8} wrap>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <PlaceStatusTag status={item.previousStatus} />
                  <Typography.Text type="secondary">-&gt;</Typography.Text>
                  <PlaceStatusTag status={item.targetStatus} />
                  <Tag color={statusColor[item.operationStatus]}>
                    {statusLabel[item.operationStatus]}
                  </Tag>
                </Flex>

                {item.errorMessage && (
                  <Typography.Text type="danger">
                    {item.errorMessage}
                  </Typography.Text>
                )}
              </Flex>
            </List.Item>
          )}
        />

        <Flex gap={8} justify="end" wrap>
          {Boolean(failedItems.length) && (
            <Button disabled={isRunning} onClick={onRetryFailed}>
              Повторить ошибки
            </Button>
          )}
          {Boolean(succeededItems.length) && (
            <Button disabled={isRunning} onClick={onUndoSucceeded}>
              Откатить успешные
            </Button>
          )}
        </Flex>
      </Flex>
    </Drawer>
  )
}
