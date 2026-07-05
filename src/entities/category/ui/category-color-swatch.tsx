import { Flex, Typography, theme } from 'antd'
import type { CSSProperties } from 'react'
import styles from './category-color-swatch.module.css'

type CategoryColorSwatchVariables = CSSProperties & {
  '--category-border': string
  '--category-color': string
}

/**
 * Показывает HEX-цвет категории как компактный swatch с текстовым значением.
 */
export function CategoryColorSwatch({ color }: { color: string }) {
  const { token } = theme.useToken()
  const style: CategoryColorSwatchVariables = {
    '--category-border': token.colorBorderSecondary,
    '--category-color': color,
  }

  return (
    <Flex className={styles.root} gap={8} style={style}>
      <span aria-hidden="true" className={styles.swatch} />
      <Typography.Text code>{color}</Typography.Text>
    </Flex>
  )
}
