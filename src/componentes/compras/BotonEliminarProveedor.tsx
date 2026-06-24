'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmarAccion from '../comunes/ConfirmarAccion'
import { useToast } from '@/componentes/comunes/ProveedorToast'

interface PropiedadesBoton {
  id: number
  nombre: string
}

export default function BotonEliminarProveedor({ id, nombre }: PropiedadesBoton) {
  const router = useRouter()
  const { toast } = useToast()
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
        toast({ titulo: errorData.error || 'Error al eliminar el proveedor', variant: 'error' })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({ titulo: 'Error al eliminar el proveedor', variant: 'error' })
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
