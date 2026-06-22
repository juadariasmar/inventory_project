'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PropiedadesBoton {
  id: string
  email: string
  esActual: boolean
}

export default function BotonEliminarUsuario({
  id,
  email,
  esActual,
}: PropiedadesBoton) {
  const router = useRouter()
  const [eliminando, setEliminando] = useState(false)

  const manejarEliminacion = async () => {
    if (esActual) {
      alert('No puedes eliminar tu propio usuario.')
      return
    }
    if (!confirm(`¿Estás seguro de eliminar el usuario "${email}"?`)) {
      return
    }

    setEliminando(true)
    try {
      const respuesta = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
      if (respuesta.ok) {
        router.refresh()
      } else {
        const errorData = await respuesta.json()
        alert(errorData.error || 'Error al eliminar el usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el usuario')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <button
      onClick={manejarEliminacion}
      disabled={eliminando || esActual}
      className={`text-sm ${
        esActual ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'
      } disabled:opacity-50`}
      title={esActual ? 'No puedes eliminar tu propio usuario' : 'Eliminar'}
    >
      {eliminando ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
