import { bulkModerationDraftMiddleware } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-middleware'
import { bulkModerationReducer } from '@/features/place/bulk-moderation/model/bulk-moderation-slice'
import { configureStore } from '@reduxjs/toolkit'

/**
 * Создает Redux store приложения.
 *
 * @remarks Нужен отдельной фабрикой, чтобы тесты могли получать чистый store без общего состояния. Подключает middleware синхронизации bulk moderation draft с `sessionStorage`.
 */
export const createAppStore = () =>
  configureStore({
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(bulkModerationDraftMiddleware),
    reducer: {
      bulkModeration: bulkModerationReducer,
    },
  })

/**
 * Redux store для runtime приложения.
 */
export const store = createAppStore()

/**
 * Тип Redux store приложения.
 */
export type AppStore = ReturnType<typeof createAppStore>

/**
 * Тип полного Redux state приложения.
 */
export type RootState = ReturnType<AppStore['getState']>

/**
 * Тип Redux dispatch приложения.
 */
export type AppDispatch = AppStore['dispatch']
