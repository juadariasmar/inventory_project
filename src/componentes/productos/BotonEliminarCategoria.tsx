'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmarAccion from '../comunes/ConfirmarAccion'

interface PropiedadesBoton {
  id: number
  nombre: string
  tieneProductos: boolean
}

export default function BotonEliminarCategoria({
  id,
  nombre,
  tieneProductos,
}: PropiedadesBoton) {
  const router = useRouter()
  const [eliminando, setEliminando] = useState(false)

  const manejarEliminacion = async () => {
    setEliminando(true)
    try {
      const respuesta = await fetch(`/api/categorias/${id}`, {
        method: 'DELETE',
      })

      if (respuesta.ok) {
        router.refresh()
      } else {
        const errorData = await respuesta.json()
        alert(errorData.error || 'Error al eliminar la categoría')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la categoría')
    } finally {
      setEliminando(false)
    }
  }

  if (tieneProductos) {
    return (
      <button
        type="button"
        disabled
        className="py-2 px-4 rounded-lg bg-gray-400 text-white opacity-50 cursor-not-allowed inline-flex items-center justify-center font-medium shadow-sm min-h-[44px]"
        title="No se puede eliminar: tiene productos asociados"
      >
        Eliminar
      </button>
    )
  }

  return (
    <ConfirmarAccion
      titulo="Eliminar categoría"
      descripcion={`¿Estás seguro de eliminar la categoría "${nombre}"? Esta acción no se puede deshacer.`}
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
