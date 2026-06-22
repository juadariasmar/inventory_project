'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Propiedades {
  id: number
  estado: 'BORRADOR' | 'RECIBIDA' | 'CANCELADA'
}

export default function AccionesOrdenCompra({ id, estado }: Propiedades) {
  const router = useRouter()
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  const ejecutar = async (
    accion: 'recibir' | 'cancelar',
    confirmacion: string
  ) => {
    if (!confirm(confirmacion)) return

    setError('')
    setProcesando(true)
    try {
      const respuesta = await fetch(`/api/ordenes-compra/${id}/${accion}`, {
        method: 'POST',
      })

      if (respuesta.ok) {
        router.refresh()
      } else {
        const errorData = await respuesta.json().catch(() => ({}))
        setError(errorData.error || 'No se pudo procesar la acción.')
        setProcesando(false)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al procesar la acción.')
      setProcesando(false)
    }
  }

  if (estado !== 'BORRADOR') {
    return (
      <p className="text-sm text-gray-500">
        {estado === 'RECIBIDA'
          ? 'Esta orden ya fue recibida y no admite más acciones.'
          : 'Esta orden fue cancelada.'}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p
          role="alert"
          className="text-sm bg-red-50 text-red-700 border border-red-200 p-2 rounded"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            ejecutar(
              'recibir',
              '¿Recibir esta orden? Se registrará la entrada de stock y la orden quedará inmutable.'
            )
          }
          disabled={procesando}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {procesando ? 'Procesando…' : 'Recibir'}
        </button>
        <button
          type="button"
          onClick={() =>
            ejecutar('cancelar', '¿Cancelar esta orden de compra?')
          }
          disabled={procesando}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancelar orden
        </button>
      </div>
    </div>
  )
}
