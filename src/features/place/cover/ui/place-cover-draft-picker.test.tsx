import { fireEvent, render, screen, within } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceCoverDraftPicker } from './place-cover-draft-picker'

const messageError = vi.fn()

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  const App = ({ children }: { children: ReactNode }) => <div>{children}</div>
  App.useApp = () => ({
    message: {
      error: messageError,
      success: vi.fn(),
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

const renderPlaceCoverDraftPicker = ({
  disabled = false,
  onChange = vi.fn(),
  selectedFile = null,
}: {
  disabled?: boolean
  onChange?: (file: File | null) => void
  selectedFile?: File | null
} = {}) => {
  render(
    <AntdApp>
      <PlaceCoverDraftPicker
        disabled={disabled}
        onChange={onChange}
        selectedFile={selectedFile}
      />
    </AntdApp>,
  )

  return { onChange }
}

describe('PlaceCoverDraftPicker', () => {
  beforeEach(() => {
    messageError.mockReset()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cover-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  it('renders an empty draft state initially', () => {
    renderPlaceCoverDraftPicker()

    expect(screen.getByText('Cover-фото не загружено')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Сбросить выбор' }),
    ).toBeDisabled()
  })

  it('previews a valid selected file and lets the admin reset it', async () => {
    const onChange = vi.fn()
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    renderPlaceCoverDraftPicker({ onChange })

    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })

    expect(screen.getByAltText('Новое cover-фото')).toHaveAttribute(
      'src',
      'blob:cover-preview',
    )
    expect(screen.getByText('Выбран файл: cover.png')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith(file)

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить выбор' }))

    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cover-preview')
  })

  it('rejects unsupported MIME types before changing selected file', async () => {
    const onChange = vi.fn()
    const file = new File(['cover'], 'cover.gif', { type: 'image/gif' })
    renderPlaceCoverDraftPicker({ onChange })

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
    expect(onChange).not.toHaveBeenCalled()
  })

  it('rejects files larger than the backend-aligned size limit', async () => {
    const onChange = vi.fn()
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 + 1 })
    renderPlaceCoverDraftPicker({ onChange })

    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })

    const alert = await screen.findByRole('alert')

    expect(
      within(alert).getByText('Файл должен быть не больше 5 MB.'),
    ).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('disables file actions while parent form is submitting', () => {
    renderPlaceCoverDraftPicker({ disabled: true })

    expect(screen.getByLabelText('Файл cover-фото')).toBeDisabled()
    expect(screen.getByRole('button', { name: /Выбрать файл/ })).toBeDisabled()
  })

  it('revokes selected preview object URL on unmount', () => {
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    const { unmount } = render(
      <AntdApp>
        <PlaceCoverDraftPicker onChange={vi.fn()} selectedFile={file} />
      </AntdApp>,
    )

    fireEvent.change(screen.getByLabelText('Файл cover-фото'), {
      target: { files: [file] },
    })
    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cover-preview')
  })
})
