import { render, screen } from '@testing-library/react'
import { Form } from 'antd'
import { describe, expect, it } from 'vitest'
import { CategoryFormFields } from './category-form-fields'

describe('CategoryFormFields', () => {
  it('hides the slug field by default for category creation', () => {
    render(
      <Form initialValues={{ badgeBackgroundColor: '#faf0ed' }}>
        <CategoryFormFields />
      </Form>,
    )

    expect(screen.queryByRole('textbox', { name: 'Ярлык' })).toBeNull()
    expect(
      screen.queryByText(
        'Часть адреса в ссылке. Обычно заполняется автоматически.',
      ),
    ).toBeNull()
  })

  it('renders the slug field as a user-facing label when enabled', () => {
    render(
      <Form initialValues={{ badgeBackgroundColor: '#faf0ed' }}>
        <CategoryFormFields showSlug />
      </Form>,
    )

    expect(screen.getByRole('textbox', { name: 'Ярлык' })).toHaveAttribute(
      'placeholder',
      'Например: family-cafe',
    )
    expect(
      screen.getByText(
        'Часть адреса в ссылке. Обычно заполняется автоматически.',
      ),
    ).toBeInTheDocument()
  })

  it('renders badge color as a color picker instead of a manual HEX input', () => {
    const { container } = render(
      <Form initialValues={{ badgeBackgroundColor: '#faf0ed' }}>
        <CategoryFormFields />
      </Form>,
    )

    expect(
      screen.queryByRole('textbox', { name: 'Цвет бейджа' }),
    ).not.toBeInTheDocument()
    expect(container.querySelector('.ant-color-picker-trigger')).not.toBeNull()
  })
})
