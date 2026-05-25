import { theme } from 'antd'
import type { CSSProperties } from 'react'

/**
 * CSS variables shared by screen-state components.
 */
export type ScreenStateVariables = CSSProperties & {
  '--screen-state-bg': string
  '--screen-state-border': string
  '--screen-state-radius': string
}

/**
 * Builds Ant Design token-backed CSS variables for screen-state frames.
 */
export function useScreenStateStyle(): ScreenStateVariables {
  const { token } = theme.useToken()

  return {
    '--screen-state-bg': token.colorBgContainer,
    '--screen-state-border': token.colorBorderSecondary,
    '--screen-state-radius': `${token.borderRadiusLG}px`,
  }
}
