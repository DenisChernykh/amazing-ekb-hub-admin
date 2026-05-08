import { DashboardPage } from '@/pages/dashboard/ui/dashboard-page'
import { LoginPage } from '@/pages/login/ui/login-page'
import { PlaceDetailPage } from '@/pages/place-detail/ui/place-detail-page'
import { PlaceEditPage } from '@/pages/place-edit/ui/place-edit-page'
import { PlacesCreatePage } from '@/pages/places-create/ui/places-create-page'
import { PlacesPage } from '@/pages/places/ui/places-page'
import { AdminShell } from '@/widgets/admin-shell/ui/admin-shell'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { RequireAuth } from './require-auth'

/**
 * Дочерние protected routes, которые рендерятся внутри общего admin shell.
 */
export const protectedRouteChildren = [
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/places',
    element: <PlacesPage />,
  },
  {
    path: '/places/:placeId',
    element: <PlaceDetailPage />,
  },
  {
    path: '/places/:placeId/edit',
    element: <PlaceEditPage />,
  },
  {
    path: '/places/new',
    element: <PlacesCreatePage />,
  },
] satisfies RouteObject[]

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
        element: <AdminShell />,
        children: protectedRouteChildren,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to="/" />,
  },
])
