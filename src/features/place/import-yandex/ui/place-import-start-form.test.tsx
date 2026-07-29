import { useStartPlaceImportMutation } from '@/entities/place-import/model/place-import-mutations'
import { placeImportStartSchema } from '@/features/place/import-yandex/model/place-import-start-schema'
import { ApiClientError } from '@/shared/api/client/api-error'
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

  it('redirects to the existing active operation on structured 409 conflict', async () => {
    const onStarted = vi.fn()
    vi.mocked(useStartPlaceImportMutation).mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () =>
            options?.onError?.(
              new ApiClientError({
                body: {
                  code: 'active_place_import_exists',
                  message: 'An active place import already exists',
                  operationId: 'operation-existing',
                  statusCode: 409,
                },
                kind: 'conflict',
                message: 'An active place import already exists',
                status: 409,
              }),
            ),
        }) as unknown as ReturnType<typeof useStartPlaceImportMutation>,
    )

    render(<PlaceImportStartForm onStarted={onStarted} />)
    fireEvent.change(screen.getByLabelText('Ссылка Яндекс Карт'), {
      target: { value: 'https://yandex.ru/maps/org/spa/1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Начать импорт' }))

    await waitFor(() => {
      expect(onStarted).toHaveBeenCalledWith('operation-existing')
    })
    expect(
      screen.queryByText('An active place import already exists'),
    ).not.toBeInTheDocument()
  })
})
