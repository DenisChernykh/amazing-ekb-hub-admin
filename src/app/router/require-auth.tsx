import { currentSessionQueryOptions } from '@/entities/session'
import { clearBulkModerationDraftSelection } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { isProblemCode } from '@/shared/api/client/api-errors'
import { useQuery } from '@tanstack/react-query'
import { Button, Flex, Layout, Result, Spin, Typography, theme } from 'antd'
import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router'
import styles from './require-auth.module.css'

const { Content } = Layout

type AuthStateScreenProps = {
  children: ReactNode
}

type AuthStateScreenVariables = CSSProperties & {
  '--auth-state-bg': string
}

function AuthStateScreen({ children }: AuthStateScreenProps) {
  const { token } = theme.useToken()
  const style: AuthStateScreenVariables = {
    '--auth-state-bg': token.colorBgLayout,
  }

  return (
    <Layout className={styles.layout} style={style}>
      <Content className={styles.content}>
        <Flex
          align="center"
          className={styles.center}
          gap={16}
          justify="center"
          vertical
        >
          {children}
        </Flex>
      </Content>
    </Layout>
  )
}

/**
 * Защищает приватные маршруты предварительной проверкой текущей сессии.
 *
 * @remarks Использует canonical session query options без suspense, чтобы
 * сохранить текущие loading/error экраны до отдельной Data Router migration.
 * При auth/permission отказе очищает feature-owned bulk moderation draft.
 */
export function RequireAuth() {
  const location = useLocation()
  const currentUserQuery = useQuery({
    ...currentSessionQueryOptions(),
    retry: false,
  })
  const isAuthenticationRequired =
    currentUserQuery.isError &&
    isProblemCode(currentUserQuery.error, 'AUTHENTICATION_REQUIRED')
  const isAuthorizationDenied =
    currentUserQuery.isError &&
    isProblemCode(currentUserQuery.error, 'AUTHORIZATION_DENIED')
  const shouldClearDraft = isAuthenticationRequired || isAuthorizationDenied

  useEffect(() => {
    if (shouldClearDraft) {
      clearBulkModerationDraftSelection()
    }
  }, [shouldClearDraft])

  if (currentUserQuery.isPending) {
    return (
      <AuthStateScreen>
        <Spin size="large" />
        <Typography.Text type="secondary">Проверяем сессию</Typography.Text>
      </AuthStateScreen>
    )
  }

  if (currentUserQuery.isError) {
    if (isAuthorizationDenied) {
      return (
        <AuthStateScreen>
          <Result
            status="403"
            title="Доступ запрещен"
            subTitle="У вашей учетной записи нет прав для этой админки."
            extra={
              <Link to="/login">
                <Button type="primary">На страницу входа</Button>
              </Link>
            }
          />
        </AuthStateScreen>
      )
    }

    const returnTo = `${location.pathname}${location.search}${location.hash}`
    const loginSearch = new URLSearchParams({ returnTo }).toString()

    return <Navigate replace to={`/login?${loginSearch}`} />
  }

  return <Outlet />
}
