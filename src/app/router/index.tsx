import { CategoriesPage } from '@/pages/categories/ui/categories-page'
import { ContentSourcesPage } from '@/pages/content-sources/ui/content-sources-page'
import { DashboardPage } from '@/pages/dashboard/ui/dashboard-page'
import { LoginPage } from '@/pages/login/ui/login-page'
import { MaterialsPage } from '@/pages/materials/ui/materials-page'
import { NotFoundPage } from '@/pages/not-found/ui/not-found-page'
import { PlaceDetailPage } from '@/pages/place-detail/ui/place-detail-page'
import { PlaceEditPage } from '@/pages/place-edit/ui/place-edit-page'
import { PlaceImportYandexPage } from '@/pages/place-import-yandex/ui/place-import-yandex-page'
import { PlacesCreatePage } from '@/pages/places-create/ui/places-create-page'
import { PlacesPage } from '@/pages/places/ui/places-page'
import { AdminShell } from '@/widgets/admin-shell/ui/admin-shell'
import { createBrowserRouter, type RouteObject } from 'react-router'
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
    path: '/categories',
    element: <CategoriesPage />,
  },
  {
    path: '/materials',
    element: <MaterialsPage />,
  },
  {
    path: '/content-sources',
    element: <ContentSourcesPage />,
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
  {
    path: '/places/import/yandex',
    element: <PlaceImportYandexPage />,
  },
  {
    path: '/places/import/yandex/:operationId',
    element: <PlaceImportYandexPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
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
])
