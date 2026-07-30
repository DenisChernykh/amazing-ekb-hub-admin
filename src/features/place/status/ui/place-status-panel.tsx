import { useUpdatePlaceStatusMutation } from '@/entities/place/model/place-mutations'
import { getPlaceStatusFromValue } from '@/entities/place/model/place-status'
import { PlaceStatusTag } from '@/entities/place/ui/place-status-tag'
import type { AdminPlaceSummaryResponseDtoStatus } from '@/shared/api'
import { isProblemCode } from '@/shared/api/client/api-errors'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Flex,
  Modal,
  Segmented,
  Space,
  Typography,
} from 'antd'
import type { ReactNode } from 'react'
import { useState } from 'react'

const statusHint: Record<AdminPlaceSummaryResponseDtoStatus, string> = {
  active: 'Место видно в публичном каталоге.',
  hidden: 'Место скрыто из публичного каталога, но доступно в админке.',
}

const statusAction: Record<
  AdminPlaceSummaryResponseDtoStatus,
  { icon: ReactNode; label: string; successMessage: string }
> = {
  active: {
    icon: <EyeOutlined aria-hidden="true" />,
    label: 'Опубликовать',
    successMessage: 'Место опубликовано',
  },
  hidden: {
    icon: <EyeInvisibleOutlined aria-hidden="true" />,
    label: 'Скрыть',
    successMessage: 'Место скрыто',
  },
}

const statusOptions = [
  {
    label: (
      <Space size={6}>
        <EyeOutlined aria-hidden="true" />
        <span>Опубликовано</span>
      </Space>
    ),
    value: 'active',
  },
  {
    label: (
      <Space size={6}>
        <EyeInvisibleOutlined aria-hidden="true" />
        <span>Скрыто</span>
      </Space>
    ),
    value: 'hidden',
  },
]

type PlaceStatusPanelProps = {
  placeId: string
  status: AdminPlaceSummaryResponseDtoStatus
}

/**
 * Панель публикации или скрытия места в административной карточке.
 *
 * @remarks Требует AntD `App` provider; меняет backend-статус и обновляет admin list/detail кеши через entity mutation.
 */
export function PlaceStatusPanel({ placeId, status }: PlaceStatusPanelProps) {
  const { message } = AntdApp.useApp()
  const [selectedStatus, setSelectedStatus] =
    useState<AdminPlaceSummaryResponseDtoStatus>(status)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false)
  const selectedAction = statusAction[selectedStatus]
  const isChanged = selectedStatus !== status
  const updateStatusMutation = useUpdatePlaceStatusMutation({
    onError: (error) => {
      const nextErrorMessage = isProblemCode(error, 'PLACE_NOT_FOUND')
        ? 'Место не найдено.'
        : getApiErrorPresentation(error).message
      setErrorMessage(nextErrorMessage)
      void message.error(nextErrorMessage)
    },
    onSuccess: (place) => {
      setIsPublishConfirmOpen(false)
      setErrorMessage(null)
      void message.success(statusAction[place.status].successMessage)
    },
  })

  const handleStatusChange = (value: string | number) => {
    const nextStatus = getPlaceStatusFromValue(value)

    if (nextStatus) {
      setErrorMessage(null)
      setSelectedStatus(nextStatus)
    }
  }

  const handleApply = () => {
    setErrorMessage(null)

    if (selectedStatus === 'active') {
      setIsPublishConfirmOpen(true)
      return
    }

    applyStatus()
  }

  const applyStatus = () => {
    updateStatusMutation.mutate({
      data: { status: selectedStatus },
      pathParams: { placeId },
    })
  }

  return (
    <Card title="Публикация">
      <Flex gap={16} vertical>
        <Flex align="center" gap={8} wrap>
          <Typography.Text type="secondary">Текущий статус:</Typography.Text>
          <PlaceStatusTag status={status} />
        </Flex>

        <Segmented
          disabled={updateStatusMutation.isPending}
          onChange={handleStatusChange}
          options={statusOptions}
          value={selectedStatus}
        />

        <Typography.Text type="secondary">
          {statusHint[selectedStatus]}
        </Typography.Text>

        {errorMessage && <Alert showIcon title={errorMessage} type="error" />}

        <Flex justify="end">
          <Button
            disabled={!isChanged}
            icon={selectedAction.icon}
            loading={updateStatusMutation.isPending}
            onClick={handleApply}
            type="primary"
          >
            {selectedAction.label}
          </Button>
        </Flex>
      </Flex>

      <Modal
        cancelText="Отмена"
        confirmLoading={updateStatusMutation.isPending}
        okText="Опубликовать"
        onCancel={() => setIsPublishConfirmOpen(false)}
        onOk={applyStatus}
        open={isPublishConfirmOpen}
        title="Опубликовать место?"
      >
        Место станет доступно в публичном каталоге. Если оно использует
        draft-категорию, категория также станет активной.
      </Modal>
    </Card>
  )
}
