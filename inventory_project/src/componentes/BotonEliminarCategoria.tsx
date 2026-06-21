'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
    if (tieneProductos) {
      alert(
        'No se puede eliminar esta categoría porque tiene productos asociados. Primero mueve o elimina los productos.'
      )
      return
    }

    if (!confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) {
      return
    }

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

  return (
    <button
      onClick={manejarEliminacion}
      disabled={eliminando}
      className={`mt-4 w-full py-3 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 min-h-[44px] flex items-center justify-center font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
        tieneProductos
          ? 'bg-gray-400 text-white'
          : 'bg-error text-white hover:bg-error-hover'
      }`}
      title={
        tieneProductos
          ? 'No se puede eliminar: tiene productos asociados'
          : 'Eliminar categoría'
      }
    >
      {eliminando ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
