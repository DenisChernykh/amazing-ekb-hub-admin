import { useUploadPlaceCoverPhotoMutation } from '@/entities/place/model/place-mutations'
import type {
  AdminPlaceSummaryResponseDto,
  PlaceCategoryResponseDto,
} from '@/shared/api'
import { createApiProblemError } from '@/test/api-problem'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceCoverUploadPanel } from './place-cover-upload-panel'

vi.mock('@/entities/place/model/place-mutations', () => ({
  useUploadPlaceCoverPhotoMutation: vi.fn(),
}))

const messageError = vi.fn()
const messageSuccess = vi.fn()

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  const App = ({ children }: { children: ReactNode }) => <div>{children}</div>
  App.useApp = () => ({
    message: {
      error: messageError,
      success: messageSuccess,
    },
  })

  const Upload = ({
    beforeUpload,
    children,
    disabled,
  }: {
    beforeUpload?: (file: File) => boolean | symbol
    children?: ReactNode
    disabled?: boolean
  }) => (
    <div>
      {children}
      <input
        aria-label="Файл cover-фото"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0]

          if (file) {
            beforeUpload?.(file)
          }
        }}
        type="file"
      />
    </div>
  )
  Upload.LIST_IGNORE = Symbol('LIST_IGNORE')

  return {
    ...actual,
    App,
    Upload,
  }
})

const mockedUseUploadPlaceCoverPhotoMutation = vi.mocked(
  useUploadPlaceCoverPhotoMutation,
)

const spaCategory = {
  coverImageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  status: 'active',
  updatedAt: '2026-01-01T00:00:00.000Z',
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
} satisfies PlaceCategoryResponseDto

const updatedPlace: AdminPlaceSummaryResponseDto = {
  category: spaCategory,
  coverImageUrl: '/places/place-2/photo',
  mapsUrl: null,
  id: 'place-2',
  slug: 'spa-with-cover',
  status: 'active',
  summary: 'SPA с новым cover-фото',
  tags: ['spa'],
  title: 'SPA',
}

const renderPlaceCoverUploadPanel = (
  coverImageUrl: string | null = '/places/place-2/photo',
) => {
  render(
    <AntdApp>
      <PlaceCoverUploadPanel coverImageUrl={coverImageUrl} placeId="place-2" />
    </AntdApp>,
  )
}

describe('PlaceCoverUploadPanel', () => {
  beforeEach(() => {
    messageError.mockReset()
    messageSuccess.mockReset()
    mockedUseUploadPlaceCoverPhotoMutation.mockReset()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cover-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  it('renders current cover preview and disabled upload action initially', () => {
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    renderPlaceCoverUploadPanel()

    expect(screen.getByAltText('Текущее cover-фото')).toHaveAttribute(
      'src',
      '/places/place-2/photo',
    )
    expect(screen.getByRole('button', { name: 'Загрузить' })).toBeDisabled()
  })

  it('renders empty state when current cover is missing', () => {
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    renderPlaceCoverUploadPanel(null)

    expect(screen.getByText('Cover-фото не загружено')).toBeInTheDocument()
  })

  it('submits selected file through entity mutation', async () => {
    const mutate = vi.fn()
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    renderPlaceCoverUploadPanel()

    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })

    expect(await screen.findByAltText('Новое cover-фото')).toHaveAttribute(
      'src',
      'blob:cover-preview',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Загрузить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: { photo: file },
        pathParams: { placeId: 'place-2' },
      })
    })
  })

  it('renders local validation error and skips mutation for invalid file', async () => {
    const mutate = vi.fn()
    const file = new File(['cover'], 'cover.gif', { type: 'image/gif' })
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    renderPlaceCoverUploadPanel()

    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })

    const alert = await screen.findByRole('alert')

    expect(
      within(alert).getByText('Загрузите JPEG, PNG или WebP файл.'),
    ).toBeInTheDocument()
    expect(messageError).toHaveBeenCalledWith(
      'Загрузите JPEG, PNG или WebP файл.',
    )
    expect(mutate).not.toHaveBeenCalled()
  })

  it('shows pending state while upload mutation is running', () => {
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    renderPlaceCoverUploadPanel()

    expect(screen.getByRole('button', { name: /Загрузить/ })).toHaveClass(
      'ant-btn-loading',
    )
    expect(screen.getByRole('button', { name: /Выбрать файл/ })).toBeDisabled()
  })

  it('shows success message and clears local preview after upload', async () => {
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    mockedUseUploadPlaceCoverPhotoMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onSuccess?.(updatedPlace)
          },
        }) as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>,
    )

    renderPlaceCoverUploadPanel()

    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Загрузить' }))

    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('Cover-фото обновлено')
    })
    expect(screen.getByAltText('Текущее cover-фото')).toBeInTheDocument()
  })

  it('renders normalized upload error and keeps selected file for retry', async () => {
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    mockedUseUploadPlaceCoverPhotoMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onError?.(createApiProblemError('VALIDATION_FAILED', 400))
          },
        }) as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>,
    )

    renderPlaceCoverUploadPanel()

    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Загрузить' }))

    const alert = await screen.findByRole('alert')

    expect(
      within(alert).getByText('Не удалось выполнить запрос.'),
    ).toBeInTheDocument()
    expect(messageError).toHaveBeenCalledWith('Не удалось выполнить запрос.')
    expect(within(alert).queryByText('Raw backend detail')).toBeNull()
    expect(screen.getByRole('button', { name: 'Загрузить' })).not.toBeDisabled()
  })
})
