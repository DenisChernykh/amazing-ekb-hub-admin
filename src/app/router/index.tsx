import { clearCurrentSession, currentSessionQueryKey } from '@/entities/session'
import { clearBulkModerationDraftSelection } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
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
import { authGetMe } from '@/shared/api'
import type { QueryClient } from '@tanstack/react-query'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { queryClient } from '../query-client'
import {
  createRedirectAuthenticatedLoader,
  createRequireSessionLoader,
} from './loaders'
import { ProtectedLayout } from './protected-layout'
import { RouteError } from './route-error'

/**
 * Загружает session напрямую из backend и записывает только актуальный ответ.
 *
 * @remarks Не использует React Query freshness: каждый route loader выполняет
 * новый `authGetMe`. Проверка `signal.aborted` до записи не даёт завершившемуся
 * после отмены запросу восстановить устаревшую сессию.
 */
async function loadSession(client: QueryClient, signal: AbortSignal) {
  const session = await authGetMe(undefined, signal)

  if (signal.aborted) {
    throw new DOMException('The session request was aborted', 'AbortError')
  }

  client.setQueryData(currentSessionQueryKey(), session)
  return session
}

/**
 * Относительные дочерние protected routes внутри общего admin shell.
 */
export const protectedRouteChildren = [
  {
    index: true,
    element: <DashboardPage />,
  },
  {
    path: 'places',
    element: <PlacesPage />,
  },
  {
    path: 'categories',
    element: <CategoriesPage />,
  },
  {
    path: 'materials',
    element: <MaterialsPage />,
  },
  {
    path: 'content-sources',
    element: <ContentSourcesPage />,
  },
  {
    path: 'places/:placeId',
    element: <PlaceDetailPage />,
  },
  {
    path: 'places/:placeId/edit',
    element: <PlaceEditPage />,
  },
  {
    path: 'places/new',
    element: <PlacesCreatePage />,
  },
  {
    path: 'places/import/yandex',
    element: <PlaceImportYandexPage />,
  },
  {
    path: 'places/import/yandex/:operationId',
    element: <PlaceImportYandexPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
] satisfies RouteObject[]

/**
 * Создаёт route tree админки для runtime browser router или memory-router теста.
 *
 * @remarks Protected и login loaders всегда проверяют свежую backend-сессию.
 * Только потеря аутентификации очищает session/CSRF cache и feature-owned bulk
 * moderation draft.
 *
 * @returns React Router route objects с общими error elements.
 */
export function createAppRoutes(client: QueryClient): RouteObject[] {
  const sessionDependencies = {
    load: (signal: AbortSignal) => loadSession(client, signal),
    clear: () => {
      clearCurrentSession(client)
      clearBulkModerationDraftSelection()
    },
  }

  return [
    {
      path: '/',
      loader: createRequireSessionLoader(sessionDependencies),
      element: <ProtectedLayout />,
      errorElement: <RouteError />,
      children: protectedRouteChildren,
    },
    {
      path: '/login',
      loader: createRedirectAuthenticatedLoader(sessionDependencies),
      element: <LoginPage />,
      errorElement: <RouteError />,
    },
  ]
}

/**
 * Browser Data Router runtime админки.
 */
export const router = createBrowserRouter(createAppRoutes(queryClient))
