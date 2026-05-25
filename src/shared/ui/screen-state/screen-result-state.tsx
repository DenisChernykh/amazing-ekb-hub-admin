import { Flex, Result, type ResultProps } from 'antd'
import type { ReactNode } from 'react'
import {
  ScreenStateActions,
  type ScreenStateAction,
} from './screen-state-action'
import { useScreenStateStyle } from './screen-state-style'
import styles from './screen-state.module.css'

/**
 * Props стандартного screen-level result state.
 */
export type ScreenResultStateProps = {
  primaryAction?: ScreenStateAction
  secondaryAction?: ScreenStateAction
  status: ResultProps['status']
  subTitle?: ReactNode
  title: ReactNode
}

/**
 * Рендерит стандартизированный forbidden/not-found/error result для route screens.
 */
export function ScreenResultState({
  primaryAction,
  secondaryAction,
  status,
  subTitle,
  title,
}: ScreenResultStateProps) {
  const style = useScreenStateStyle()

  return (
    <Flex
      align="center"
      className={styles.frame}
      justify="center"
      style={style}
      vertical
    >
      <Result
        className={styles.result}
        extra={
          <ScreenStateActions
            primaryAction={primaryAction}
            secondaryAction={secondaryAction}
          />
        }
        status={status}
        subTitle={subTitle}
        title={title}
      />
    </Flex>
  )
}
