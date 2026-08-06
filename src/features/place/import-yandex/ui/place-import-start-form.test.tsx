import { useStartPlaceImportMutation } from '@/entities/place-import/model/place-import-mutations'
import { placeImportStartSchema } from '@/features/place/import-yandex/model/place-import-start-schema'
import { createApiProblemError } from '@/test/api-problem'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceImportStartForm } from './place-import-start-form'

vi.mock('@/entities/place-import/model/place-import-mutations', async () => {
  const actual = await vi.importActual<
    typeof import('@/entities/place-import/model/place-import-mutations')
  >('@/entities/place-import/model/place-import-mutations')

  return {
    ...actual,
    useStartPlaceImportMutation: vi.fn(),
  }
})

describe('PlaceImportStartForm', () => {
  beforeEach(() => {
    vi.mocked(useStartPlaceImportMutation).mockReset()
  })

  it('returns exact local validation messages for missing and unsafe URLs', () => {
    expect(
      placeImportStartSchema.safeParse({ url: '' }).error?.issues[0]?.message,
    ).toBe('Вставьте ссылку на карточку организации')
    expect(
      placeImportStartSchema.safeParse({ url: 'javascript:alert(1)' }).error
        ?.issues[0]?.message,
    ).toBe('Введите ссылку с протоколом http или https')
  })

  it('blocks an unsafe URL before starting an import', async () => {
    const mutate = vi.fn()
    vi.mocked(useStartPlaceImportMutation).mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useStartPlaceImportMutation>)

    render(<PlaceImportStartForm onStarted={vi.fn()} />)

    expect(screen.getByText('Ссылка Яндекс Карт').closest('label')).toHaveClass(
      'ant-form-item-required',
    )

    fireEvent.change(screen.getByLabelText('Ссылка Яндекс Карт'), {
      target: { value: 'javascript:alert(1)' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Начать импорт' }))

    expect(
      await screen.findByText('Введите ссылку с протоколом http или https'),
    ).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('submits a trimmed valid URL', async () => {
    const mutate = vi.fn()
    vi.mocked(useStartPlaceImportMutation).mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useStartPlaceImportMutation>)

    render(<PlaceImportStartForm onStarted={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Ссылка Яндекс Карт'), {
      target: { value: '  https://yandex.ru/maps/org/spa/1  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Начать импорт' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        url: 'https://yandex.ru/maps/org/spa/1',
      })
    })
  })

  it('includes a validated targeted collection in the start payload', async () => {
    const mutate = vi.fn()
    vi.mocked(useStartPlaceImportMutation).mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useStartPlaceImportMutation>)

    render(
      <PlaceImportStartForm
        onStarted={vi.fn()}
        targetCollectionId="collection-1"
        targetCollectionTitle="SPA"
      />,
    )
    expect(screen.getByText('Целевая подборка: SPA')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Ссылка Яндекс Карт'), {
      target: { value: 'https://yandex.ru/maps/org/spa/1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Начать импорт' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        targetCollectionId: 'collection-1',
        url: 'https://yandex.ru/maps/org/spa/1',
      })
    })
  })

  it('redirects to the existing active operation on structured 409 conflict', async () => {
    const onAlreadyActive = vi.fn()
    const onStarted = vi.fn()
    vi.mocked(useStartPlaceImportMutation).mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () =>
            options?.onError?.(
              createApiProblemError('PLACE_IMPORT_ALREADY_ACTIVE', 409),
            ),
        }) as unknown as ReturnType<typeof useStartPlaceImportMutation>,
    )

    render(
      <PlaceImportStartForm
        onAlreadyActive={onAlreadyActive}
        onStarted={onStarted}
      />,
    )
    fireEvent.change(screen.getByLabelText('Ссылка Яндекс Карт'), {
      target: { value: 'https://yandex.ru/maps/org/spa/1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Начать импорт' }))

    await waitFor(() => {
      expect(onAlreadyActive).toHaveBeenCalled()
    })
    expect(onStarted).not.toHaveBeenCalled()
    expect(
      screen.queryByText('An active place import already exists'),
    ).not.toBeInTheDocument()
  })
})
