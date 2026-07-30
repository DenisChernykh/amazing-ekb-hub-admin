import { useUpdateMaterialAdminStatusMutation } from '@/entities/material/model/material-mutations'
import { getMaterialAdminStatusMeta } from '@/entities/material/ui/material-meta'
import type {
  AdminMaterialLibraryResponseDto,
  AdminMaterialLibraryResponseDtoAdminStatus,
} from '@/shared/api'
import { isProblemCode } from '@/shared/api/client/api-errors'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { CheckOutlined, CloseOutlined, InboxOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, Button, Flex, Space } from 'antd'
import type { ReactNode } from 'react'
import { useState } from 'react'

type ReviewableMaterialAdminStatus = Exclude<
  AdminMaterialLibraryResponseDtoAdminStatus,
  'pending'
>

type MaterialAdminStatusAction = {
  icon: ReactNode
  label: string
  status: ReviewableMaterialAdminStatus
  successMessage: string
}

const statusActions: MaterialAdminStatusAction[] = [
  {
    icon: <CheckOutlined aria-hidden="true" />,
    label: 'Одобрить',
    status: 'approved',
    successMessage: 'Материал одобрен',
  },
  {
    icon: <CloseOutlined aria-hidden="true" />,
    label: 'Отклонить',
    status: 'rejected',
    successMessage: 'Материал отклонен',
  },
  {
    icon: <InboxOutlined aria-hidden="true" />,
    label: 'В архив',
    status: 'archived',
    successMessage: 'Материал отправлен в архив',
  },
]

type MaterialAdminStatusActionsProps = {
  material: AdminMaterialLibraryResponseDto
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

  const handleStatusChange = (action: MaterialAdminStatusAction) => {
    setErrorMessage(null)
    updateStatusMutation.mutate(
      {
        adminStatus: action.status,
        materialId: material.id,
      },
      {
        onError: (error) => {
          const presentation = getApiErrorPresentation(error)
          const errorMessage = isProblemCode(error, 'MATERIAL_NOT_FOUND')
            ? 'Материал не найден.'
            : presentation.message
          setErrorMessage(errorMessage)
          void message.error(errorMessage)
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
        {statusActions.map((action) => (
          <Button
            disabled={
              updateStatusMutation.isPending ||
              material.adminStatus === action.status
            }
            icon={action.icon}
            key={action.status}
            onClick={() => {
              handleStatusChange(action)
            }}
            size="small"
            title={getMaterialAdminStatusMeta(action.status).label}
          >
            {action.label}
          </Button>
        ))}
      </Space>

      {errorMessage && <Alert message={errorMessage} showIcon type="error" />}
    </Flex>
  )
}
