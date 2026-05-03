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
      className="text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {eliminando ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
