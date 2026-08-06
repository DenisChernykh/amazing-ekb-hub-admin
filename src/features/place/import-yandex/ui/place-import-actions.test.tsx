import {
  useCancelPlaceImportMutation,
  useConfirmPlaceImportMutation,
} from '@/entities/place-import/model/place-import-mutations'
import type { PlaceImportOperationResponseDto } from '@/shared/api'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceImportActions } from './place-import-actions'

vi.mock('@/entities/place-import/model/place-import-mutations', () => ({
  useCancelPlaceImportMutation: vi.fn(),
  useConfirmPlaceImportMutation: vi.fn(),
}))

const messageSuccess = vi.fn()
vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  const App = ({ children }: { children: ReactNode }) => <div>{children}</div>
  App.useApp = () => ({ message: { error: vi.fn(), success: messageSuccess } })
  return { ...actual, App }
})

const preview: PlaceImportOperationResponseDto = {
  attempt: 1,
  captchaExpiresAt: null,
  category: null,
  createdAt: '2026-07-22T10:00:00.000Z',
  error: null,
  id: 'operation-1',
  mapsUrl: 'https://yandex.ru/maps/org/spa/1',
  organizationId: '1',
  outcome: null,
  possibleDuplicate: null,
  previewExpiresAt: '2026-07-22T11:00:00.000Z',
  resultPlaceId: null,
  sourceUrl: 'https://yandex.ru/maps/org/spa/1',
  status: 'preview_ready',
  targetCollection: null,
  title: 'SPA',
  updatedAt: '2026-07-22T10:01:00.000Z',
  version: 3,
}

describe('PlaceImportActions', () => {
  beforeEach(() => {
    messageSuccess.mockReset()
  })

  it('does not claim a new place was created for a strict duplicate', () => {
    vi.mocked(useCancelPlaceImportMutation).mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCancelPlaceImportMutation>)
    vi.mocked(useConfirmPlaceImportMutation).mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () =>
            options?.onSuccess?.({
              ...preview,
              outcome: 'already_exists',
              resultPlaceId: 'place-existing',
              status: 'completed',
              version: 4,
            }),
        }) as unknown as ReturnType<typeof useConfirmPlaceImportMutation>,
    )

    render(
      <AntdApp>
        <PlaceImportActions operation={preview} />
      </AntdApp>,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Создать скрытое место' }),
    )
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Создать место',
      }),
    )

    expect(messageSuccess).toHaveBeenCalledWith('Открываем существующее место')
    expect(messageSuccess).not.toHaveBeenCalledWith('Место создано скрытым')
  })

  it('reports a newly created hidden place accurately', () => {
    vi.mocked(useCancelPlaceImportMutation).mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCancelPlaceImportMutation>)
    vi.mocked(useConfirmPlaceImportMutation).mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () =>
            options?.onSuccess?.({
              ...preview,
              outcome: 'created',
              resultPlaceId: 'place-created',
              status: 'completed',
              version: 4,
            }),
        }) as unknown as ReturnType<typeof useConfirmPlaceImportMutation>,
    )

    render(
      <AntdApp>
        <PlaceImportActions operation={preview} />
      </AntdApp>,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Создать скрытое место' }),
    )
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Создать место',
      }),
    )

    expect(messageSuccess).toHaveBeenCalledWith('Место создано скрытым')
  })

  it('blocks confirmation while the operation snapshot may be stale', () => {
    vi.mocked(useCancelPlaceImportMutation).mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCancelPlaceImportMutation>)
    vi.mocked(useConfirmPlaceImportMutation).mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useConfirmPlaceImportMutation>)

    render(
      <AntdApp>
        <PlaceImportActions isConfirmDisabled operation={preview} />
      </AntdApp>,
    )

    expect(
      screen.getByRole('button', { name: 'Создать скрытое место' }),
    ).toBeDisabled()
  })

  it('prevents cancel and modal dismissal while confirmation is pending', () => {
    let isConfirmPending = false
    vi.mocked(useCancelPlaceImportMutation).mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCancelPlaceImportMutation>)
    vi.mocked(useConfirmPlaceImportMutation).mockImplementation(
      () =>
        ({
          isPending: isConfirmPending,
          mutate: vi.fn(),
        }) as unknown as ReturnType<typeof useConfirmPlaceImportMutation>,
    )

    const { rerender } = render(
      <AntdApp>
        <PlaceImportActions operation={preview} />
      </AntdApp>,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Создать скрытое место' }),
    )
    isConfirmPending = true
    rerender(
      <AntdApp>
        <PlaceImportActions operation={preview} />
      </AntdApp>,
    )

    expect(
      screen.getByRole('button', { name: 'Отменить импорт' }),
    ).toBeDisabled()
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('button', { name: 'Вернуться к preview' }),
    ).toBeDisabled()
    expect(
      within(dialog).queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument()
  })
})
