/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import ErrorGlobal from '../../app/error'
import '@testing-library/jest-dom'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('ErrorGlobal component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders AccesoDenegado for 403 / 401 / permission errors', () => {
    const authError = new Error('Acceso denegado')
    render(<ErrorGlobal error={authError} reset={jest.fn()} />)
    expect(screen.getByText('Acceso Restringido')).toBeInTheDocument()
  })

  it('renders generic error screen for other errors', () => {
    const dbError = new Error('Conexión de base de datos fallida')
    render(<ErrorGlobal error={dbError} reset={jest.fn()} />)
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(screen.getByText('Conexión de base de datos fallida')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
