'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Propiedades {
  cotizacionId: number
  puedeConvertir: boolean
  puedeCancelar: boolean
}

type Accion = 'convertir' | 'cancelar' | null

export default function BotonesCotizacion({
  cotizacionId,
  puedeConvertir,
  puedeCancelar,
}: Propiedades) {
  const router = useRouter()
  const [accion, setAccion] = useState<Accion>(null)
  const [motivo, setMotivo] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!accion) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !trabajando) cerrar()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [accion, trabajando])

  const cerrar = () => {
    setAccion(null)
    setMotivo('')
    setError('')
  }

  const convertir = async () => {
    if (!confirm('¿Convertir esta cotización en venta?\n\nSe descontará el stock y se generará una venta con los mismos items.')) {
      return
    }
    setTrabajando(true)
    setError('')
    try {
      const r = await fetch(`/api/cotizaciones/${cotizacionId}/convertir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (r.ok) {
        const { venta } = await r.json()
        router.push(`/ventas/${venta.id}/recibo`)
        router.refresh()
      } else {
        const e = await r.json().catch(() => ({}))
        setError(e.error || 'No se pudo convertir la cotización.')
        setTrabajando(false)
      }
    } catch {
      setError('Error al convertir la cotización.')
      setTrabajando(false)
    }
  }

  const cancelar = async () => {
    const motivoLimpio = motivo.trim()
    if (!motivoLimpio) {
      setError('Debes indicar un motivo de cancelación.')
      return
    }
    setTrabajando(true)
    setError('')
    try {
      const r = await fetch(`/api/cotizaciones/${cotizacionId}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoLimpio }),
      })
      if (r.ok) {
        cerrar()
        router.refresh()
      } else {
        const e = await r.json().catch(() => ({}))
        setError(e.error || 'No se pudo cancelar la cotización.')
        setTrabajando(false)
      }
    } catch {
      setError('Error al cancelar la cotización.')
      setTrabajando(false)
    }
  }

  if (!puedeConvertir && !puedeCancelar) return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {puedeConvertir && (
          <button
            type="button"
            onClick={convertir}
            disabled={trabajando}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-semibold disabled:opacity-50"
          >
            Convertir a venta
          </button>
        )}
        {puedeCancelar && (
          <button
            type="button"
            onClick={() => setAccion('cancelar')}
            disabled={trabajando}
            className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-md text-sm disabled:opacity-50"
          >
            Cancelar cotización
          </button>
        )}
      </div>

      {accion === 'cancelar' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !trabajando && cerrar()}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Cancelar cotización #{cotizacionId}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                La cotización quedará marcada como cancelada y el stock reservado
                se libera. No se puede deshacer.
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
                placeholder="Ej: el cliente desistió, cambió la solicitud, etc."
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
                disabled={trabajando}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                No cancelar
              </button>
              <button
                type="button"
                onClick={cancelar}
                disabled={trabajando || !motivo.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold disabled:opacity-50"
              >
                {trabajando ? 'Cancelando…' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && accion !== 'cancelar' && (
        <p className="mt-2 text-sm text-red-800 bg-red-50 border border-red-200 p-2 rounded">
          {error}
        </p>
      )}
    </>
  )
}
