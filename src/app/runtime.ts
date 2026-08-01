import { createBrowserRouter } from 'react-router'

import { createAppRuntime } from './app-runtime'
import { createAppRoutes } from './router'

const runtime = createAppRuntime((client) =>
  createBrowserRouter(createAppRoutes(client)),
)

/** Единый QueryClient runtime приложения. */
export const queryClient = runtime.queryClient

/** Единый browser Data Router runtime приложения. */
export const router = runtime.router
