import { DashboardOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { createElement, type ReactNode } from 'react'

/**
 * Пункт основной навигации защищенной админки.
 */
export type AdminNavigationItem = {
  icon: ReactNode
  key: string
  label: string
  path: string
}

/**
 * Основные разделы админки, доступные из sidebar.
 */
export const adminNavigationItems = [
  {
    icon: createElement(DashboardOutlined),
    key: 'dashboard',
    label: 'Дашборд',
    path: '/',
  },
  {
    icon: createElement(UnorderedListOutlined),
    key: 'places',
    label: 'Места',
    path: '/places',
  },
] satisfies AdminNavigationItem[]

/**
 * Возвращает выбранный пункт sidebar по текущему pathname.
 */
export const getSelectedNavigationKey = (pathname: string) => {
  const currentItem = adminNavigationItems.find(
    (item) => item.path === pathname,
  )

  return currentItem?.key ?? 'dashboard'
}
