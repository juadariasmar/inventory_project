/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, act } from '@testing-library/react'
import AccesoDenegado from '../../componentes/comunes/AccesoDenegado'
import '@testing-library/jest-dom'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('AccesoDenegado component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    render(<AccesoDenegado />)
    expect(screen.getByText('Acceso Restringido')).toBeInTheDocument()
    expect(
      screen.getByText('No tienes los permisos necesarios para acceder a esta sección o tu sesión no es válida.')
    ).toBeInTheDocument()
    expect(screen.getByText('Redireccionando al panel principal...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir de inmediato' })).toBeInTheDocument()
  })

  it('redirects automatically after 3 seconds', () => {
    render(<AccesoDenegado />)
    expect(mockPush).not.toHaveBeenCalled()
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('redirects immediately when button is clicked', () => {
    render(<AccesoDenegado />)
    const button = screen.getByRole('button', { name: 'Ir de inmediato' })
    button.click()
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
