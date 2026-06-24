'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmarAccion from '../comunes/ConfirmarAccion'
import { useToast } from '@/componentes/comunes/ProveedorToast'

interface PropiedadesBoton {
  id: number
  nombre: string
}

export default function BotonEliminarProducto({ id, nombre }: PropiedadesBoton) {
  const router = useRouter()
  const { toast } = useToast()
  const [eliminando, setEliminando] = useState(false)

  const manejarEliminacion = async () => {
    setEliminando(true)
    try {
      const respuesta = await fetch(`/api/productos/${id}`, {
        method: 'DELETE',
      })

      if (respuesta.ok) {
        router.refresh()
      } else {
        toast({ titulo: 'Error al eliminar el producto', variant: 'error' })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({ titulo: 'Error al eliminar el producto', variant: 'error' })
    } finally {
      setEliminando(false)
    }
  }

  return (
    <ConfirmarAccion
      titulo="Eliminar producto"
      descripcion={`¿Estás seguro de eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`}
      accion="Eliminar"
      variant="danger"
      onConfirm={manejarEliminacion}
      trigger={
        <button
          type="button"
          disabled={eliminando}
          className="bg-error text-white py-2 px-4 rounded-lg hover:bg-error-hover transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 min-h-[44px] inline-flex items-center justify-center font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {eliminando ? 'Eliminando...' : 'Eliminar'}
        </button>
      }
    />
  )
}
