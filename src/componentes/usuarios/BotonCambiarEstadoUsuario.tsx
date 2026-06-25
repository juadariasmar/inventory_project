'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmarAccion from '../comunes/ConfirmarAccion'

interface PropiedadesBoton {
  id: string
  estado: 'PENDIENTE' | 'ACTIVO' | 'SUSPENDIDO'
  esActual: boolean
}

export default function BotonCambiarEstadoUsuario({
  id,
  estado,
  esActual,
}: PropiedadesBoton) {
  const router = useRouter()
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  const cambiarEstado = async (nuevoEstado: 'ACTIVO' | 'SUSPENDIDO') => {
    setProcesando(true)
    setError('')
    try {
      const respuesta = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (respuesta.ok) {
        router.refresh()
      } else {
        const errorData = await respuesta.json().catch(() => ({}))
        setError(errorData.error || 'Error al cambiar el estado del usuario')
      }
    } catch (e) {
      console.error('Error:', e)
      setError('Error al cambiar el estado del usuario')
    } finally {
      setProcesando(false)
    }
  }

  if (esActual) {
    return null
  }

  if (estado === 'PENDIENTE') {
    return (
      <>
        <button
          onClick={() => cambiarEstado('ACTIVO')}
          disabled={procesando}
          className="text-sm text-green-600 hover:text-green-800 disabled:opacity-50"
        >
          {procesando ? 'Procesando...' : 'Aprobar'}
        </button>
        {error && (
          <span role="alert" className="text-xs text-red-600">
            {error}
          </span>
        )}
      </>
    )
  }

  if (estado === 'SUSPENDIDO') {
    return (
      <>
        <button
          onClick={() => cambiarEstado('ACTIVO')}
          disabled={procesando}
          className="text-sm text-green-600 hover:text-green-800 disabled:opacity-50"
        >
          {procesando ? 'Procesando...' : 'Reactivar'}
        </button>
        {error && (
          <span role="alert" className="text-xs text-red-600">
            {error}
          </span>
        )}
      </>
    )
  }

  return (
    <>
      <ConfirmarAccion
        titulo="Suspender usuario"
        descripcion="¿Estás seguro de suspender este usuario? No podrá acceder al sistema hasta que sea reactivado."
        accion="Suspender"
        variant="danger"
        onConfirm={() => cambiarEstado('SUSPENDIDO')}
        trigger={
          <button
            type="button"
            disabled={procesando}
            className="text-sm text-amber-600 hover:text-amber-800 disabled:opacity-50"
          >
            {procesando ? 'Procesando...' : 'Suspender'}
          </button>
        }
      />
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </>
  )
}
