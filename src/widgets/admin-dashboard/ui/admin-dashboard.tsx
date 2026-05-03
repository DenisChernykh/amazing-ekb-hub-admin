import { useCurrentUser } from '@/entities/session/model/current-user'
import { getRoleMeta } from '@/entities/session/ui/role-meta'
import { RoleTag } from '@/entities/session/ui/role-tag'
import { LogoutButton } from '@/features/auth/logout/ui/logout-button'
import {
  Card,
  Descriptions,
  Flex,
  Layout,
  Space,
  Typography,
  theme,
} from 'antd'
import type { CSSProperties } from 'react'
import styles from './admin-dashboard.module.css'

const { Content, Header } = Layout

type AdminDashboardVariables = CSSProperties & {
  '--dashboard-bg': string
  '--dashboard-border': string
  '--dashboard-surface': string
}

/**
 * Базовый защищенный dashboard widget с текущей сессией и действием logout.
 */
export function AdminDashboard() {
  const user = useCurrentUser()
  const role = getRoleMeta(user.role)
  const { token } = theme.useToken()
  const style: AdminDashboardVariables = {
    '--dashboard-bg': token.colorBgLayout,
    '--dashboard-border': token.colorBorderSecondary,
    '--dashboard-surface': token.colorBgContainer,
  }

  return (
    <Layout className={styles.layout} style={style}>
      <Header className={styles.header}>
        <Flex align="center" gap={24} justify="space-between" wrap>
          <Flex gap={4} vertical>
            <Typography.Title className={styles.title} level={1}>
              Amazing EKB Hub Admin
            </Typography.Title>
            <Typography.Text type="secondary">
              Базовая сессия подключена. Следующий шаг — рабочие разделы
              админки.
            </Typography.Text>
          </Flex>

          <LogoutButton />
        </Flex>
      </Header>

      <Content className={styles.content}>
        <Card>
          <Flex gap={24} vertical>
            <Space wrap>
              <RoleTag role={user.role} />
              <Typography.Text strong>{user.email}</Typography.Text>
            </Space>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Роль">{role.label}</Descriptions.Item>
            </Descriptions>
          </Flex>
        </Card>
      </Content>
    </Layout>
  )
}
