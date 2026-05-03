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
      className={`text-sm ${
        tieneProductos
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-red-600 hover:text-red-800'
      } disabled:opacity-50`}
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
