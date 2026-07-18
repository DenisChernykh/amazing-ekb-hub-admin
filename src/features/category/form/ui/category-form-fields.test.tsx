import { render, screen } from '@testing-library/react'
import { Form } from 'antd'
import { describe, expect, it } from 'vitest'
import { CategoryFormFields } from './category-form-fields'

describe('CategoryFormFields', () => {
  it('hides the slug field by default for category creation', () => {
    render(
      <Form>
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
      <Form>
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

  it('does not render the removed badge color control', () => {
    const { container } = render(
      <Form>
        <CategoryFormFields />
      </Form>,
    )

    expect(
      screen.queryByRole('textbox', { name: 'Цвет бейджа' }),
    ).not.toBeInTheDocument()
    expect(container.querySelector('.ant-color-picker-trigger')).toBeNull()
  })
})
