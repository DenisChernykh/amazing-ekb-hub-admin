import { LoginForm } from '@/features/auth/login/ui/login-form'
import { Card, Flex, Layout, Typography, theme } from 'antd'
import type { CSSProperties } from 'react'
import type { Location } from 'react-router'
import { useLocation, useNavigate } from 'react-router'
import styles from './auth-login-screen.module.css'

type LoginLocationState = {
  from?: Location
}

const { Content } = Layout

const getRedirectPath = (state: unknown) => {
  const from = (state as LoginLocationState | null)?.from

  if (!from || from.pathname === '/login') {
    return '/'
  }

  return `${from.pathname}${from.search}${from.hash}`
}

type AuthLoginScreenVariables = CSSProperties & {
  '--login-bg': string
}

/**
 * Экран входа, который управляет layout и redirect после успешной авторизации.
 */
export function AuthLoginScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const redirectTo = getRedirectPath(location.state)
  const style: AuthLoginScreenVariables = {
    '--login-bg': token.colorBgLayout,
  }

  return (
    <Layout className={styles.layout} style={style}>
      <Content className={styles.content}>
        <Flex align="center" className={styles.center} justify="center">
          <Card className={styles.card}>
            <Typography.Title className={styles.title} level={1}>
              Amazing EKB Hub Admin
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              Войдите с учетной записью администратора.
            </Typography.Paragraph>

            <LoginForm
              onLoggedIn={() => {
                navigate(redirectTo, { replace: true })
              }}
            />
          </Card>
        </Flex>
      </Content>
    </Layout>
  )
}
