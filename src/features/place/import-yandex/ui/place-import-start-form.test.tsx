import { useStartPlaceImportMutation } from '@/entities/place-import/model/place-import-mutations'
import { ApiClientError } from '@/shared/api/client/api-error'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
