import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import { Flex, Typography } from 'antd'
import type { CSSProperties, ReactNode } from 'react'
import styles from './content-sources-screen.module.css'

/**
 * Общая shell-обертка для loading/error states content sources screen.
 */
export function ContentSourcesStateLayout({
  children,
  style,
}: {
  children: ReactNode
  style: CSSProperties
}) {
  return (
    <Flex gap={16} style={style} vertical>
      <DocumentTitle title="Источники контента" />
      <Typography.Title className={styles.title} level={2}>
        Источники контента
      </Typography.Title>
      {children}
    </Flex>
  )
}
