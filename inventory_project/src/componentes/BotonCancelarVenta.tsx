'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Propiedades {
  ventaId: number
  // Apariencia del trigger. Por defecto "outline" (para recibo).
  // "compact" es pensado para filas de tabla (texto pequeno tipo link).
  variante?: 'outline' | 'compact'
}

export default function BotonCancelarVenta({
  ventaId,
  variante = 'outline',
}: Propiedades) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState('')

  const cerrar = () => {
    setAbierto(false)
    setMotivo('')
    setError('')
  }

  // Cerrar con Escape mientras el modal este abierto.
  useEffect(() => {
    if (!abierto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !cancelando) cerrar()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, cancelando])

  const cancelar = async () => {
    const motivoLimpio = motivo.trim()
    if (!motivoLimpio) {
      setError('Debes indicar un motivo de cancelación.')
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
        cerrar()
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

  const claseBoton =
    variante === 'compact'
      ? 'text-red-600 hover:text-red-800 text-sm'
      : 'px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-md text-sm'

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={claseBoton}
      >
        Cancelar
        {variante === 'outline' ? ' venta' : ''}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !cancelando && cerrar()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-cancelar"
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3
                id="titulo-cancelar"
                className="text-lg font-bold text-gray-800"
              >
                Cancelar venta #{ventaId}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Esta acción devuelve el stock de cada producto y deja la venta
                marcada en el historial. No se puede deshacer.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo *
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Ej: error en el cobro, devolución del cliente, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 p-2 rounded">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={cerrar}
                disabled={cancelando}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                No cancelar
              </button>
              <button
                type="button"
                onClick={cancelar}
                disabled={cancelando || !motivo.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold disabled:opacity-50"
              >
                {cancelando ? 'Cancelando…' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
