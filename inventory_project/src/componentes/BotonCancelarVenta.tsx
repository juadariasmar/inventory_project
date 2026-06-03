'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Propiedades {
  ventaId: number
}

export default function BotonCancelarVenta({ ventaId }: Propiedades) {
  const router = useRouter()
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState('')

  const cancelar = async () => {
    const motivoLimpio = motivo.trim()
    if (!motivoLimpio) {
      setError('Debes indicar un motivo de cancelación.')
      return
    }
    if (
      !confirm(
        `¿Cancelar la venta #${ventaId}?\n\n` +
          'Esta acción:\n' +
          ' · Devuelve el stock de cada producto.\n' +
          ' · Marca la venta como cancelada en el historial.\n' +
          ' · No suma a los totales del día.\n\n' +
          'No se puede deshacer.'
      )
    ) {
      return
    }
    setCancelando(true)
    setError('')
    try {
      const r = await fetch(`/api/ventas/${ventaId}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoLimpio }),
      })
      if (r.ok) {
        router.refresh()
      } else {
        const e = await r.json().catch(() => ({}))
        setError(e.error || 'No se pudo cancelar la venta.')
        setCancelando(false)
      }
    } catch {
      setError('Error al cancelar la venta.')
      setCancelando(false)
    }
  }

  if (!mostrarFormulario) {
    return (
      <button
        type="button"
        onClick={() => setMostrarFormulario(true)}
        className="px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-md text-sm"
      >
        Cancelar venta
      </button>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-3 w-full max-w-md">
      <div>
        <h3 className="text-sm font-semibold text-red-800">Cancelar venta</h3>
        <p className="text-xs text-red-700 mt-1">
          Devuelve el stock y deja la venta marcada en el historial. Esta
          acción es solo para administradores y solo el mismo día.
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-red-900 mb-1">
          Motivo *
        </label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          placeholder="Ej: error en el cobro, devolución del cliente, etc."
          className="w-full px-2 py-1.5 border border-red-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      {error && (
        <p className="text-xs text-red-800 bg-red-100 p-2 rounded">{error}</p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setMostrarFormulario(false)
            setMotivo('')
            setError('')
          }}
          disabled={cancelando}
          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
        >
          No cancelar
        </button>
        <button
          type="button"
          onClick={cancelar}
          disabled={cancelando || !motivo.trim()}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold disabled:opacity-50"
        >
          {cancelando ? 'Cancelando…' : 'Confirmar cancelación'}
        </button>
      </div>
    </div>
  )
}
