import { usePlaceCategoriesQuery } from '@/entities/category/model/category-hooks'
import {
  useCreatePlaceMutation,
  useUploadPlaceCoverPhotoMutation,
} from '@/entities/place/model/place-mutations'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { PlaceSummary } from '@/shared/api/generated/model'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreatePlaceForm } from './create-place-form'

vi.mock('@/entities/place/model/place-mutations', () => ({
  useCreatePlaceMutation: vi.fn(),
  useUploadPlaceCoverPhotoMutation: vi.fn(),
}))

vi.mock('@/entities/category/model/category-hooks', () => ({
  usePlaceCategoriesQuery: vi.fn(),
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
    Select: ({
      'aria-label': ariaLabel,
      mode,
      onChange,
      options = [],
      value,
    }: {
      'aria-label'?: string
      mode?: 'tags'
      onChange?: (value: string | string[]) => void
      options?: Array<{ label: string; value: string }>
      value?: string | string[]
    }) => {
      if (mode === 'tags') {
        return (
          <input
            aria-label={ariaLabel}
            onChange={(event) => {
              onChange?.(
                event.target.value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              )
            }}
            role="combobox"
            value={Array.isArray(value) ? value.join(',') : ''}
          />
        )
      }

      return (
        <select
          aria-label={ariaLabel}
          onChange={(event) => {
            onChange?.(event.target.value)
          }}
          value={typeof value === 'string' ? value : ''}
        >
          <option value="" />
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    },
    InputNumber: ({
      id,
      onChange,
      value,
    }: {
      id?: string
      onChange?: (value: number | null) => void
      value?: number | null
    }) => (
      <input
        id={id}
        onChange={(event) => {
          const nextValue = event.target.value
          onChange?.(nextValue ? Number(nextValue) : null)
        }}
        type="number"
        value={value ?? ''}
      />
    ),
  }
})

const mockedUseCreatePlaceMutation = vi.mocked(useCreatePlaceMutation)
const mockedUseUploadPlaceCoverPhotoMutation = vi.mocked(
  useUploadPlaceCoverPhotoMutation,
)
const mockedUsePlaceCategoriesQuery = vi.mocked(usePlaceCategoriesQuery)

const spaCategory = {
  coverImageUrl: null,
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
}

const createdPlace: PlaceSummary = {
  category: spaCategory,
  coverImageUrl: null,
  id: 'place-1',
  slug: 'quiet-spa',
  status: 'active',
  summary: 'Новый SPA в центре',
  tags: ['spa'],
  title: 'Тихий SPA',
}

const uploadedPlace: PlaceSummary = {
  ...createdPlace,
  coverImageUrl: '/places/place-1/photo',
}

const renderCreatePlaceForm = () => {
  const onCancel = vi.fn()
  const onCreated = vi.fn()

  render(
    <AntdApp>
      <MemoryRouter>
        <CreatePlaceForm onCancel={onCancel} onCreated={onCreated} />
      </MemoryRouter>
    </AntdApp>,
  )

  return { onCancel, onCreated }
}

const fillRequiredPlaceFields = () => {
  fireEvent.change(screen.getByLabelText('Название'), {
    target: { value: 'Тихий SPA' },
  })
  fireEvent.change(screen.getByRole('combobox', { name: 'Категория' }), {
    target: { value: 'category_spa' },
  })
}

describe('CreatePlaceForm', () => {
  beforeEach(() => {
    messageError.mockReset()
    messageSuccess.mockReset()
    mockedUseCreatePlaceMutation.mockReset()
    mockedUseUploadPlaceCoverPhotoMutation.mockReset()
    mockedUsePlaceCategoriesQuery.mockReset()
    mockedUsePlaceCategoriesQuery.mockReturnValue({
      data: { items: [spaCategory] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceCategoriesQuery>)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cover-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  it('submits create place payload without a cover photo and reports created id', async () => {
    const createMutateAsync = vi.fn().mockResolvedValue(createdPlace)
    const uploadMutateAsync = vi.fn().mockResolvedValue(uploadedPlace)
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: createMutateAsync,
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutateAsync: uploadMutateAsync,
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    const { onCreated } = renderCreatePlaceForm()

    fillRequiredPlaceFields()
    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: 'Новый SPA в центре' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Теги' }), {
      target: { value: 'spa' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({
        data: {
          categoryId: 'category_spa',
          summary: 'Новый SPA в центре',
          tags: ['spa'],
          title: 'Тихий SPA',
        },
      })
    })
    expect(uploadMutateAsync).not.toHaveBeenCalled()
    expect(onCreated).toHaveBeenCalledWith('place-1')
  })

  it('submits create payload without summary and tags', async () => {
    const createMutateAsync = vi.fn().mockResolvedValue(createdPlace)
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: createMutateAsync,
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(uploadedPlace),
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    renderCreatePlaceForm()

    fillRequiredPlaceFields()
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({
        data: {
          categoryId: 'category_spa',
          summary: '',
          tags: [],
          title: 'Тихий SPA',
        },
      })
    })
  })

  it('uploads a selected valid cover photo after creating the place', async () => {
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    const createMutateAsync = vi.fn().mockResolvedValue(createdPlace)
    const uploadMutateAsync = vi.fn().mockResolvedValue(uploadedPlace)
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: createMutateAsync,
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutateAsync: uploadMutateAsync,
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    const { onCreated } = renderCreatePlaceForm()

    fillRequiredPlaceFields()
    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalled()
    })
    expect(uploadMutateAsync).toHaveBeenCalledWith({
      data: { photo: file },
      pathParams: { placeId: 'place-1' },
    })
    expect(onCreated).toHaveBeenCalledWith('place-1')
  })

  it('rejects invalid cover files locally and never uploads them', async () => {
    const file = new File(['cover'], 'cover.gif', { type: 'image/gif' })
    const createMutateAsync = vi.fn().mockResolvedValue(createdPlace)
    const uploadMutateAsync = vi.fn().mockResolvedValue(uploadedPlace)
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: createMutateAsync,
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutateAsync: uploadMutateAsync,
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    renderCreatePlaceForm()

    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })
    fillRequiredPlaceFields()
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(
      await screen.findByText('Загрузите JPEG, PNG или WebP файл.'),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalled()
    })
    expect(uploadMutateAsync).not.toHaveBeenCalled()
  })

  it('renders validation error messages from create API response and skips upload', async () => {
    const uploadMutateAsync = vi.fn().mockResolvedValue(uploadedPlace)
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockRejectedValue(
        new ApiClientError({
          kind: 'validation',
          message: 'title must be a string',
          messages: ['title must be a string', 'categoryId must be valid'],
          status: 400,
        }),
      ),
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutateAsync: uploadMutateAsync,
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    renderCreatePlaceForm()

    fillRequiredPlaceFields()
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    const alert = await screen.findByRole('alert')

    expect(
      within(alert).getByText('title must be a string'),
    ).toBeInTheDocument()
    expect(
      within(alert).getByText('categoryId must be valid'),
    ).toBeInTheDocument()
    expect(uploadMutateAsync).not.toHaveBeenCalled()
  })

  it('shows partial success when upload fails after create and keeps the created place link', async () => {
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    const createMutateAsync = vi.fn().mockResolvedValue(createdPlace)
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: createMutateAsync,
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockRejectedValue(
        new ApiClientError({
          kind: 'server',
          message: 'upload failed',
          messages: ['upload failed'],
          status: 500,
        }),
      ),
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    const { onCreated } = renderCreatePlaceForm()

    fillRequiredPlaceFields()
    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    const alert = await screen.findByRole('alert')

    expect(
      within(alert).getByText('Место создано, но cover-фото не загрузилось'),
    ).toBeInTheDocument()
    expect(within(alert).getByText('upload failed')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Открыть созданное место' }),
    ).toHaveAttribute('href', '/places/place-1')
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('prevents duplicate create submission after partial success', async () => {
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    const createMutateAsync = vi.fn().mockResolvedValue(createdPlace)
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: createMutateAsync,
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockRejectedValue(
        new ApiClientError({
          kind: 'server',
          message: 'upload failed',
          messages: ['upload failed'],
          status: 500,
        }),
      ),
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    renderCreatePlaceForm()

    fillRequiredPlaceFields()
    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(createMutateAsync).toHaveBeenCalledTimes(1)
  })

  it('calls cancel callback from secondary action', () => {
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(createdPlace),
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(uploadedPlace),
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)
    const { onCancel } = renderCreatePlaceForm()

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(onCancel).toHaveBeenCalled()
  })

  it('shows pending state on submit button while create mutation runs', () => {
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: true,
      mutateAsync: vi.fn().mockResolvedValue(createdPlace),
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)
    mockedUseUploadPlaceCoverPhotoMutation.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(uploadedPlace),
    } as unknown as ReturnType<typeof useUploadPlaceCoverPhotoMutation>)

    renderCreatePlaceForm()

    expect(screen.getByRole('button', { name: 'Создать' })).toHaveClass(
      'ant-btn-loading',
    )
    expect(screen.getByLabelText('Файл cover-фото')).toBeDisabled()
  })
})
