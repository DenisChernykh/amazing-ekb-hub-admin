import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getRoleMeta } from './role-meta'
import { RoleTag } from './role-tag'

describe('RoleTag', () => {
  it('renders localized admin role label', () => {
    render(<RoleTag role="admin" />)

    expect(screen.getByText('Администратор')).toBeInTheDocument()
  })

  it('renders localized user role label', () => {
    render(<RoleTag role="user" />)

    expect(screen.getByText('Пользователь')).toBeInTheDocument()
  })

  it('exposes role metadata for non-tag role displays', () => {
    expect(getRoleMeta('admin')).toMatchObject({
      color: 'green',
      label: 'Администратор',
    })
  })
})
