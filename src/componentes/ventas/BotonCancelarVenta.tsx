'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

interface Propiedades {
  ventaId: number
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
    <Dialog.Root open={abierto} onOpenChange={setAbierto}>
      <Dialog.Trigger asChild>
        <button type="button" className={claseBoton}>
          Cancelar{variante === 'outline' ? ' venta' : ''}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md rounded-xl bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out">
          <Dialog.Title className="text-lg font-bold text-gray-800">
            Cancelar venta #{ventaId}
          </Dialog.Title>

          <Dialog.Description className="text-sm text-gray-600 mt-2">
            Esta acción devuelve el stock de cada producto y deja la venta
            marcada en el historial. No se puede deshacer.
          </Dialog.Description>

          <div className="mt-4">
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
            <p className="mt-3 text-sm text-red-800 bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2 border-t border-gray-200 pt-4">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={cancelando}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                No cancelar
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={cancelar}
              disabled={cancelando || !motivo.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold disabled:opacity-50"
            >
              {cancelando ? 'Cancelando…' : 'Confirmar cancelación'}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
