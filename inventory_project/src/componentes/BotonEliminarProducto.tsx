'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PropiedadesBoton {
  id: number
  nombre: string
}

export default function BotonEliminarProducto({ id, nombre }: PropiedadesBoton) {
  const router = useRouter()
  const [eliminando, setEliminando] = useState(false)

  const manejarEliminacion = async () => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) {
      return
    }

    setEliminando(true)

    try {
      const respuesta = await fetch(`/api/productos/${id}`, {
        method: 'DELETE',
      })

      if (respuesta.ok) {
        router.refresh()
      } else {
        alert('Error al eliminar el producto')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el producto')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <button
      onClick={manejarEliminacion}
      disabled={eliminando}
      className="bg-error text-white py-2 px-4 rounded-lg hover:bg-error-hover transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 min-h-[44px] inline-flex items-center justify-center font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {eliminando ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
