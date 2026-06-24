'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/componentes/comunes/Input'
import { Button } from '@/componentes/comunes/Button'
import { AlertCircle } from 'lucide-react'

export default function FormularioCategoria() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      const respuesta = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      })

      if (respuesta.ok) {
        router.push('/categorias')
        router.refresh()
      } else {
        const errorData = await respuesta.json()
        setError(errorData.error || 'Error al crear la categoría')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al crear la categoría')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-6" noValidate>
      {error && (
        <div role="alert" className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Input
        label="Nombre de la Categoría"
        id="nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej: Electrónicos, Ropa, Alimentos..."
        required
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={guardando} loadingText="Guardando...">
          Crear Categoría
        </Button>
      </div>
    </form>
  )
}
