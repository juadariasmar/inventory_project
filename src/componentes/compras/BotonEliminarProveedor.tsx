'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmarAccion from '../comunes/ConfirmarAccion'

interface PropiedadesBoton {
  id: number
  nombre: string
}

export default function BotonEliminarProveedor({ id, nombre }: PropiedadesBoton) {
  const router = useRouter()
  const [eliminando, setEliminando] = useState(false)

  const manejarEliminacion = async () => {
    setEliminando(true)
    try {
      const respuesta = await fetch(`/api/proveedores/${id}`, {
        method: 'DELETE',
      })

      if (respuesta.ok) {
        router.refresh()
      } else {
        const errorData = await respuesta.json().catch(() => ({}))
        alert(errorData.error || 'Error al eliminar el proveedor')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el proveedor')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <ConfirmarAccion
      titulo="Eliminar proveedor"
      descripcion={`¿Estás seguro de eliminar el proveedor "${nombre}"? Esta acción no se puede deshacer.`}
      accion="Eliminar"
      variant="danger"
      onConfirm={manejarEliminacion}
      trigger={
        <button
          type="button"
          disabled={eliminando}
          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Eliminar proveedor"
        >
          {eliminando ? 'Eliminando...' : 'Eliminar'}
        </button>
      }
    />
  )
}
