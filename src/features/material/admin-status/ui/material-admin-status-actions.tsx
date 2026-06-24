import { useUpdateMaterialAdminStatusMutation } from '@/entities/material/model/material-mutations'
import { getMaterialAdminStatusMeta } from '@/entities/material/ui/material-meta'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type {
  AdminMaterialLibraryItem,
  MaterialAdminStatus,
} from '@/shared/api/generated/model'
import { CheckOutlined, CloseOutlined, InboxOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, Button, Flex, Space } from 'antd'
import type { ReactNode } from 'react'
import { useState } from 'react'

const statusAction: Record<
  Exclude<MaterialAdminStatus, 'pending'>,
  { icon: ReactNode; label: string; successMessage: string }
> = {
  approved: {
    icon: <CheckOutlined aria-hidden="true" />,
    label: 'Одобрить',
    successMessage: 'Материал одобрен',
  },
  rejected: {
    icon: <CloseOutlined aria-hidden="true" />,
    label: 'Отклонить',
    successMessage: 'Материал отклонен',
  },
  archived: {
    icon: <InboxOutlined aria-hidden="true" />,
    label: 'В архив',
    successMessage: 'Материал отправлен в архив',
  },
}

type MaterialAdminStatusActionsProps = {
  material: AdminMaterialLibraryItem
}

/**
 * Рендерит review actions для материала из общей библиотеки.
 *
 * @remarks Требует AntD `App` provider; меняет review-статус через entity mutation и показывает локальную ошибку для retry.
 */
export function MaterialAdminStatusActions({
  material,
}: MaterialAdminStatusActionsProps) {
  const { message } = AntdApp.useApp()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const updateStatusMutation = useUpdateMaterialAdminStatusMutation()

  const handleStatusChange = (
    adminStatus: Exclude<MaterialAdminStatus, 'pending'>,
  ) => {
    const action = statusAction[adminStatus]

    setErrorMessage(null)
    updateStatusMutation.mutate(
      {
        adminStatus,
        materialId: material.id,
      },
      {
        onError: (error) => {
          const apiError = normalizeApiError(error)
          setErrorMessage(apiError.message)
          void message.error(apiError.message)
        },
        onSuccess: () => {
          setErrorMessage(null)
          void message.success(action.successMessage)
        },
      },
    )
  }

  return (
    <Flex gap={8} vertical>
      <Space size={[4, 4]} wrap>
        {Object.entries(statusAction).map(([status, action]) => (
          <Button
            disabled={
              updateStatusMutation.isPending || material.adminStatus === status
            }
            icon={action.icon}
            key={status}
            onClick={() => {
              handleStatusChange(
                status as Exclude<MaterialAdminStatus, 'pending'>,
              )
            }}
            size="small"
            title={
              getMaterialAdminStatusMeta(status as MaterialAdminStatus).label
            }
          >
            {action.label}
          </Button>
        ))}
      </Space>

      {errorMessage && <Alert message={errorMessage} showIcon type="error" />}
    </Flex>
  )
}
