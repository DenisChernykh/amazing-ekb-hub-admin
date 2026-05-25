import { Flex, Spin, Typography } from 'antd'
import { useScreenStateStyle } from './screen-state-style'
import styles from './screen-state.module.css'

/**
 * Props полноэкранного состояния загрузки.
 */
export type ScreenLoadingStateProps = {
  subtitle?: string
  title: string
}

/**
 * Рендерит стандартизированное состояние загрузки для screen-level queries.
 */
export function ScreenLoadingState({
  subtitle,
  title,
}: ScreenLoadingStateProps) {
  const style = useScreenStateStyle()

  return (
    <Flex
      align="center"
      className={styles.frame}
      gap={12}
      justify="center"
      style={style}
      vertical
    >
      <Spin size="large" />
      <Typography.Text strong>{title}</Typography.Text>
      {subtitle && (
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      )}
    </Flex>
  )
}
