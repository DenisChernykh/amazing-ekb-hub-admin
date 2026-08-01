import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { App as AntdApp, ConfigProvider } from 'antd'
import ruRU from 'antd/locale/ru_RU'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { queryClient } from './runtime'
import { store } from './store'

dayjs.locale('ru')

type AppProvidersProps = {
  children: ReactNode
}

/**
 * Подключает глобальные провайдеры Ant Design, React Query, Redux и devtools.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ConfigProvider locale={ruRU}>
      <AntdApp>
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </ReduxProvider>
      </AntdApp>
    </ConfigProvider>
  )
}
