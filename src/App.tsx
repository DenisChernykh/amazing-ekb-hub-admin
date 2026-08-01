import { AppProviders } from '@/app/providers'
import { router } from '@/app/runtime'
import { RouterProvider } from 'react-router'

/**
 * Корневой компонент SPA, который оставляет экранную композицию router и FSD-слоям.
 */
export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
