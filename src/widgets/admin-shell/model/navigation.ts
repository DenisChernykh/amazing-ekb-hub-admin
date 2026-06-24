import {
  ApiOutlined,
  DashboardOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
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
  {
    icon: createElement(FileTextOutlined),
    key: 'materials',
    label: 'Материалы',
    path: '/materials',
  },
  {
    icon: createElement(ApiOutlined),
    key: 'contentSources',
    label: 'Источники',
    path: '/content-sources',
  },
] satisfies AdminNavigationItem[]

/**
 * Возвращает выбранный пункт sidebar по текущему pathname.
 */
export const getSelectedNavigationKey = (pathname: string) => {
  const currentItem = adminNavigationItems.find((item) => {
    if (item.path === '/') {
      return pathname === item.path
    }

    return pathname === item.path || pathname.startsWith(`${item.path}/`)
  })

  return currentItem?.key ?? 'dashboard'
}
