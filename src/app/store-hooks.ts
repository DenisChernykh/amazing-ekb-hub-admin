import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from 'react-redux'
import type { AppDispatch, RootState } from './store'

/**
 * Типизированный `useDispatch` для Redux store приложения.
 */
export const useAppDispatch: () => AppDispatch = useDispatch

/**
 * Типизированный `useSelector` для Redux store приложения.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
