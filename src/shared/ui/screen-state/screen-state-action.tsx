import { Button, Space, type ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

/**
 * Описание действия для shared screen-state компонентов.
 *
 * @remarks Если указан `to`, действие рендерится как React Router link с Ant Design button внутри.
 */
export type ScreenStateAction = {
  icon?: ReactNode
  label: string
  onClick?: () => void
  to?: string
  type?: ButtonProps['type']
}

/**
 * Props для внутреннего renderer-а screen-state actions.
 */
export type ScreenStateActionsProps = {
  primaryAction?: ScreenStateAction
  secondaryAction?: ScreenStateAction
}

const renderAction = (
  action: ScreenStateAction,
  fallbackType: ButtonProps['type'],
) => {
  const button = (
    <Button
      icon={action.icon}
      onClick={action.onClick}
      type={action.type ?? fallbackType}
    >
      {action.label}
    </Button>
  )

  return action.to ? <Link to={action.to}>{button}</Link> : button
}

/**
 * Рендерит набор primary/secondary действий для shared screen states.
 */
export function ScreenStateActions({
  primaryAction,
  secondaryAction,
}: ScreenStateActionsProps) {
  if (!primaryAction && !secondaryAction) {
    return null
  }

  return (
    <Space wrap>
      {primaryAction && renderAction(primaryAction, 'primary')}
      {secondaryAction && renderAction(secondaryAction, 'default')}
    </Space>
  )
}
