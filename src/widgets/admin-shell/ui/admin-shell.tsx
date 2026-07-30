import { RoleTag, useCurrentSession } from '@/entities/session'
import { LogoutButton } from '@/features/auth/logout/ui/logout-button'
import { Flex, Layout, Menu, Space, Typography, theme } from 'antd'
import type { CSSProperties } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import {
  adminNavigationItems,
  getSelectedNavigationKey,
} from '../model/navigation'
import styles from './admin-shell.module.css'

const { Content, Header, Sider } = Layout

type AdminShellVariables = CSSProperties & {
  '--admin-shell-bg': string
  '--admin-shell-border': string
  '--admin-shell-surface': string
}

/**
 * Общий protected shell админки с навигацией, role tags и content outlet.
 *
 * @remarks Читает suspense session query внутри защищённой ветки router.
 */
export function AdminShell() {
  const location = useLocation()
  const { data: user } = useCurrentSession()
  const { token } = theme.useToken()
  const style: AdminShellVariables = {
    '--admin-shell-bg': token.colorBgLayout,
    '--admin-shell-border': token.colorBorderSecondary,
    '--admin-shell-surface': token.colorBgContainer,
  }

  return (
    <Layout className={styles.layout} style={style}>
      <Sider
        breakpoint="lg"
        className={styles.sider}
        collapsedWidth={0}
        theme="light"
        width={232}
      >
        <div className={styles.brand}>
          <Typography.Title className={styles.brandTitle} level={4}>
            Amazing EKB Hub
          </Typography.Title>
        </div>

        <Menu
          className={styles.menu}
          items={adminNavigationItems.map((item) => ({
            icon: item.icon,
            key: item.key,
            label: <Link to={item.path}>{item.label}</Link>,
          }))}
          mode="inline"
          selectedKeys={[getSelectedNavigationKey(location.pathname)]}
        />
      </Sider>

      <Layout className={styles.main}>
        <Header className={styles.header}>
          <Flex align="center" gap={16} justify="space-between" wrap>
            <Typography.Title className={styles.brandTitle} level={3}>
              Администратор
            </Typography.Title>

            <Space wrap>
              {user.roleKeys.map((roleKey) => (
                <RoleTag key={roleKey} roleKey={roleKey} />
              ))}
              <LogoutButton />
            </Space>
          </Flex>
        </Header>

        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
