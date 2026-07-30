import { LoginForm } from '@/features/auth/login/ui/login-form'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import { Card, Flex, Layout, Typography, theme } from 'antd'
import type { CSSProperties } from 'react'
import { useLocation } from 'react-router'
import styles from './auth-login-screen.module.css'

const { Content } = Layout

type AuthLoginScreenVariables = CSSProperties & {
  '--login-bg': string
}

/**
 * Экран входа, который передаёт query-string `returnTo` в login feature.
 *
 * @remarks Требует Router context для чтения текущего location и
 * `QueryClientProvider` для login mutation во вложенной форме.
 */
export function AuthLoginScreen() {
  const location = useLocation()
  const { token } = theme.useToken()
  const returnTo = new URLSearchParams(location.search).get('returnTo')
  const style: AuthLoginScreenVariables = {
    '--login-bg': token.colorBgLayout,
  }

  return (
    <>
      <DocumentTitle title="Вход" />
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

              <LoginForm returnTo={returnTo} />
            </Card>
          </Flex>
        </Content>
      </Layout>
    </>
  )
}
