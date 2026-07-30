import { useImportTelegramSourceMutation } from '@/entities/content-source/model/content-source-mutations'
import type {
  ContentSourceResponseDto,
  ImportRunResponseDto,
} from '@/shared/api'
import { ApiClientError } from '@/shared/api/client/api-error'
import { fireEvent, render, screen } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ImportTelegramSourceButton } from './import-telegram-source-button'

vi.mock('@/entities/content-source/model/content-source-mutations', () => ({
  useImportTelegramSourceMutation: vi.fn(),
}))

const messageError = vi.fn()
const messageInfo = vi.fn()
const messageSuccess = vi.fn()

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  const App = ({ children }: { children: ReactNode }) => <div>{children}</div>
  App.useApp = () => ({
    message: {
      error: messageError,
      info: messageInfo,
      success: messageSuccess,
    },
  })

  return {
    ...actual,
    App,
  }
})

const mockedUseImportTelegramSourceMutation = vi.mocked(
  useImportTelegramSourceMutation,
)

type ImportMutationCallbacks = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (importRun: ImportRunResponseDto) => void
}

type ImportMutationVariables = {
  sourceId: string
}

const contentSource: ContentSourceResponseDto = {
  channelId: null,
  createdAt: '2026-06-15T10:00:00.000Z',
  displayName: 'Amazing EKB Telegram',
  externalId: null,
  handle: 'amazing_ekb',
  id: 'source-1',
  lastCursor: null,
  lastImportedAt: null,
  platform: 'telegram',
  status: 'active',
  updatedAt: '2026-06-15T10:00:00.000Z',
  url: 'https://t.me/amazing_ekb',
}

const renderButton = (source = contentSource) => {
  render(
    <AntdApp>
      <ImportTelegramSourceButton contentSource={source} />
    </AntdApp>,
  )
}

describe('ImportTelegramSourceButton', () => {
  beforeEach(() => {
    messageError.mockReset()
    messageInfo.mockReset()
    messageSuccess.mockReset()
    mockedUseImportTelegramSourceMutation.mockReset()
  })

  it('renders only for active Telegram source and submits import without limit params', () => {
    const mutate = vi.fn()
    mockedUseImportTelegramSourceMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useImportTelegramSourceMutation>)

    renderButton()

    fireEvent.click(screen.getByRole('button', { name: 'Запустить импорт' }))

    expect(mutate).toHaveBeenCalledWith(
      { sourceId: 'source-1' },
      expect.any(Object),
    )
  })

  it('does not render for disabled Telegram source', () => {
    mockedUseImportTelegramSourceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useImportTelegramSourceMutation>)

    renderButton({ ...contentSource, status: 'disabled' })
    expect(
      screen.queryByRole('button', { name: 'Запустить импорт' }),
    ).not.toBeInTheDocument()
  })

  it('does not render for active non-Telegram source', () => {
    mockedUseImportTelegramSourceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useImportTelegramSourceMutation>)

    renderButton({
      ...contentSource,
      platform: 'dzen',
      url: 'https://dzen.ru/amazing-ekb',
    })

    expect(
      screen.queryByRole('button', { name: 'Запустить импорт' }),
    ).not.toBeInTheDocument()
  })

  it('renders normalized import errors', async () => {
    mockedUseImportTelegramSourceMutation.mockReturnValue({
      isPending: false,
      mutate: (
        _variables: ImportMutationVariables,
        callbacks?: ImportMutationCallbacks,
      ) => {
        callbacks?.onError?.(
          new ApiClientError({
            kind: 'server',
            message: 'Import unavailable',
            status: 500,
          }),
        )
      },
    } as unknown as ReturnType<typeof useImportTelegramSourceMutation>)

    renderButton()

    fireEvent.click(screen.getByRole('button', { name: 'Запустить импорт' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Import unavailable',
    )
    expect(messageError).toHaveBeenCalledWith('Import unavailable')
  })

  it('disables import action while pending', () => {
    mockedUseImportTelegramSourceMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useImportTelegramSourceMutation>)

    renderButton()

    expect(
      screen.getByRole('button', { name: 'Запустить импорт' }),
    ).toBeDisabled()
  })

  it('disables import action and shows active run counters', () => {
    mockedUseImportTelegramSourceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useImportTelegramSourceMutation>)

    render(
      <AntdApp>
        <ImportTelegramSourceButton
          activeImportRun={{
            createdAt: '2026-06-24T08:00:00.000Z',
            createdCount: 2,
            errorMessage: null,
            finishedAt: null,
            foundCount: 3,
            id: 'run-1',
            skippedDuplicateCount: 1,
            sourceId: 'source-1',
            startedAt: null,
            status: 'queued',
            updatedAt: '2026-06-24T08:00:00.000Z',
            updatedCount: 0,
          }}
          contentSource={contentSource}
        />
      </AntdApp>,
    )

    expect(
      screen.getByRole('button', { name: 'Запустить импорт' }),
    ).toBeDisabled()
    expect(screen.getByText('Импорт в очереди')).toBeInTheDocument()
    expect(
      screen.getByText('Найдено 3 · Создано 2 · Обновлено 0 · Дубликаты 1'),
    ).toBeInTheDocument()
  })

  it('treats 409 conflicts as an already active import state', async () => {
    mockedUseImportTelegramSourceMutation.mockReturnValue({
      isPending: false,
      mutate: (
        _variables: ImportMutationVariables,
        callbacks?: ImportMutationCallbacks,
      ) => {
        callbacks?.onError?.(
          new ApiClientError({
            kind: 'conflict',
            message: 'Import already running',
            status: 409,
          }),
        )
      },
    } as unknown as ReturnType<typeof useImportTelegramSourceMutation>)

    renderButton()

    fireEvent.click(screen.getByRole('button', { name: 'Запустить импорт' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Импорт уже выполняется. Обновляем статус.',
    )
    expect(messageInfo).toHaveBeenCalledWith(
      'Импорт уже выполняется. Обновляем статус.',
    )
    expect(messageError).not.toHaveBeenCalled()
  })
})
