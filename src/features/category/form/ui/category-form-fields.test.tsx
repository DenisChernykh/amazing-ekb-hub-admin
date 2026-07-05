import { render, screen } from '@testing-library/react'
import { Form } from 'antd'
import { describe, expect, it } from 'vitest'
import { CategoryFormFields } from './category-form-fields'

describe('CategoryFormFields', () => {
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
