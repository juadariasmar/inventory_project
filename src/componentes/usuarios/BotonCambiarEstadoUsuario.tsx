'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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

  const cambiarEstado = async (
    nuevoEstado: 'ACTIVO' | 'SUSPENDIDO',
    confirmar?: string
  ) => {
    if (confirmar && !window.confirm(confirmar)) {
      return
    }

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

  // El propio usuario logueado no puede suspenderse a sí mismo.
  if (estado === 'ACTIVO' && esActual) {
    return null
  }

  let etiqueta: string
  let claseColor: string
  let accion: () => void

  if (estado === 'PENDIENTE') {
    etiqueta = 'Aprobar'
    claseColor = 'text-green-600 hover:text-green-800'
    accion = () => cambiarEstado('ACTIVO')
  } else if (estado === 'ACTIVO') {
    etiqueta = 'Suspender'
    claseColor = 'text-amber-600 hover:text-amber-800'
    accion = () =>
      cambiarEstado('SUSPENDIDO', '¿Estás seguro de suspender este usuario?')
  } else {
    etiqueta = 'Reactivar'
    claseColor = 'text-green-600 hover:text-green-800'
    accion = () => cambiarEstado('ACTIVO')
  }

  return (
    <>
      <button
        onClick={accion}
        disabled={procesando}
        className={`text-sm ${claseColor} disabled:opacity-50`}
        title={etiqueta}
      >
        {procesando ? 'Procesando...' : etiqueta}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </>
  )
}
