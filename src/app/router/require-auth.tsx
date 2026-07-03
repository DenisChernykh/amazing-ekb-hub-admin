import { CurrentUserContext } from '@/entities/session/model/current-user'
import { useCurrentSessionQuery } from '@/entities/session/model/session-hooks'
import { clearBulkModerationDraftSelection } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { getApiErrorStatus } from '@/shared/api/client/api-error'
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
 * Защищает приватные маршруты, загружает текущую сессию и прокидывает пользователя через context.
 *
 * @remarks При потере backend-сессии очищает browser draft выбора bulk moderation, чтобы приватное UI-state не переживало logout/session loss.
 */
export function RequireAuth() {
  const location = useLocation()
  const currentUserQuery = useCurrentSessionQuery()

  useEffect(() => {
    if (currentUserQuery.isError) {
      clearBulkModerationDraftSelection()
    }
  }, [currentUserQuery.isError])

  if (currentUserQuery.isPending) {
    return (
      <AuthStateScreen>
        <Spin size="large" />
        <Typography.Text type="secondary">Проверяем сессию</Typography.Text>
      </AuthStateScreen>
    )
  }

  if (currentUserQuery.isError) {
    if (getApiErrorStatus(currentUserQuery.error) === 403) {
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

    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return (
    <CurrentUserContext.Provider value={currentUserQuery.data}>
      <Outlet />
    </CurrentUserContext.Provider>
  )
}
