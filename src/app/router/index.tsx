import { DashboardPage } from '@/pages/dashboard/ui/dashboard-page'
import { LoginPage } from '@/pages/login/ui/login-page'
import { createBrowserRouter, Navigate } from 'react-router'
import { RequireAuth } from './require-auth'

/**
 * Browser router админки с публичным login и защищенным корневым маршрутом.
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to="/" />,
  },
])
