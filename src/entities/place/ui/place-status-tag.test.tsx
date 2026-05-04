import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlaceStatusTag } from './place-status-tag'

describe('PlaceStatusTag', () => {
  it('renders localized status label', () => {
    render(<PlaceStatusTag status="hidden" />)

    expect(screen.getByText('Скрыто')).toBeInTheDocument()
  })
})
