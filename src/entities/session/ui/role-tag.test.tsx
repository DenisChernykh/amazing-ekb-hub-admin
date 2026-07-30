import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getRoleMeta } from './role-meta'
import { RoleTag } from './role-tag'

describe('RoleTag', () => {
  it('renders localized admin role label', () => {
    render(<RoleTag roleKey="admin" />)

    expect(screen.getByText('Администратор')).toBeInTheDocument()
  })

  it('renders localized user role label', () => {
    render(<RoleTag roleKey="user" />)

    expect(screen.getByText('Пользователь')).toBeInTheDocument()
  })

  it('renders an unknown backend role key with neutral metadata', () => {
    render(<RoleTag roleKey="content_editor" />)

    expect(screen.getByText('content_editor')).toBeInTheDocument()
    expect(getRoleMeta('content_editor')).toEqual({
      color: 'default',
      label: 'content_editor',
    })
  })

  it('exposes role metadata for non-tag role displays', () => {
    expect(getRoleMeta('admin')).toMatchObject({
      color: 'green',
      label: 'Администратор',
    })
  })
})
