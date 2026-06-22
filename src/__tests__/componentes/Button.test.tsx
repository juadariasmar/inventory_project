/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '../../componentes/comunes/Button'
import '@testing-library/jest-dom'

describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('shows loading state when isLoading is true', () => {
    render(<Button isLoading>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Cargando...' })).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('can be disabled', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDisabled()
  })
})
