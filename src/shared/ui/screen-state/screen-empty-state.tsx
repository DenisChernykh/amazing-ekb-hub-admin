import { Empty, Typography } from 'antd'
import type { ReactNode } from 'react'
import {
  ScreenStateActions,
  type ScreenStateAction,
} from './screen-state-action'
import styles from './screen-state.module.css'

/**
 * Props empty state для списков и панелей.
 */
export type ScreenEmptyStateProps = {
  description: ReactNode
  primaryAction?: ScreenStateAction
  secondaryAction?: ScreenStateAction
}

/**
 * Рендерит reusable empty state с опциональными primary/reset действиями.
 */
export function ScreenEmptyState({
  description,
  primaryAction,
  secondaryAction,
}: ScreenEmptyStateProps) {
  return (
    <Empty
      className={styles.empty}
      description={
        <Typography.Text className={styles.emptyDescription} type="secondary">
          {description}
        </Typography.Text>
      }
    >
      <ScreenStateActions
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
    </Empty>
  )
}
