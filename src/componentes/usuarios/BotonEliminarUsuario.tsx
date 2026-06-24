'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmarAccion from '../comunes/ConfirmarAccion'
import { useToast } from '@/componentes/comunes/ProveedorToast'

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
  const { toast } = useToast()
  const [eliminando, setEliminando] = useState(false)

  const manejarEliminacion = async () => {
    setEliminando(true)
    try {
      const respuesta = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
      if (respuesta.ok) {
        router.refresh()
      } else {
        const errorData = await respuesta.json()
        toast({ titulo: errorData.error || 'Error al eliminar el usuario', variant: 'error' })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({ titulo: 'Error al eliminar el usuario', variant: 'error' })
    } finally {
      setEliminando(false)
    }
  }

  if (esActual) {
    return (
      <span
        className="text-sm text-gray-400 cursor-not-allowed"
        title="No puedes eliminar tu propio usuario"
      >
        Eliminar
      </span>
    )
  }

  return (
    <ConfirmarAccion
      titulo="Eliminar usuario"
      descripcion={`¿Estás seguro de eliminar el usuario "${email}"? Esta acción no se puede deshacer.`}
      accion="Eliminar"
      variant="danger"
      onConfirm={manejarEliminacion}
      trigger={
        <button
          type="button"
          disabled={eliminando}
          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {eliminando ? 'Eliminando...' : 'Eliminar'}
        </button>
      }
    />
  )
}
