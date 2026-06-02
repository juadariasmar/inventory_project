'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Propiedades {
  id: number
  nombre: string
  stockActual: number
  precio: number
}

export default function BotonVenderProducto({
  id,
  nombre,
  stockActual,
  precio,
}: Propiedades) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [cantidad, setCantidad] = useState('1')
  const [notas, setNotas] = useState('Venta')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cerrar = () => {
    if (guardando) return
    setAbierto(false)
    setCantidad('1')
    setNotas('Venta')
    setError('')
  }

  const registrar = async () => {
    setError('')
    const cantidadNum = parseInt(cantidad)
    if (!cantidadNum || cantidadNum <= 0) {
      setError('Ingresa una cantidad mayor a cero')
      return
    }
    if (cantidadNum > stockActual) {
      setError(`Solo hay ${stockActual} en stock`)
      return
    }

    setGuardando(true)
    try {
      const resp = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: id,
          tipo: 'salida',
          cantidad: cantidadNum,
          notas: notas || 'Venta',
        }),
      })
      if (resp.ok) {
        cerrar()
        router.refresh()
      } else {
        const err = await resp.json().catch(() => ({}))
        setError(err.error || 'Error al registrar la venta')
      }
    } catch {
      setError('Error de red al registrar la venta')
    } finally {
      setGuardando(false)
    }
  }

  const totalVenta = (parseInt(cantidad) || 0) * precio

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={stockActual <= 0}
        className="text-emerald-600 hover:text-emerald-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        title={stockActual <= 0 ? 'Sin stock' : 'Registrar venta'}
      >
        Vender
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={cerrar}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Registrar venta
              </h2>
              <p className="text-sm text-gray-600 truncate">{nombre}</p>
              <p className="text-xs text-gray-500 mt-1">
                Stock disponible: <strong>{stockActual}</strong> · Precio
                unitario: ${precio.toLocaleString('es-MX')}
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="cantidad-venta"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cantidad
              </label>
              <input
                id="cantidad-venta"
                type="number"
                min={1}
                max={stockActual}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="notas-venta"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notas (opcional)
              </label>
              <input
                id="notas-venta"
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Venta"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {totalVenta > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-sm">
                <span className="text-gray-600">Total venta: </span>
                <span className="font-bold text-emerald-700">
                  ${totalVenta.toLocaleString('es-MX')}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cerrar}
                disabled={guardando}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={registrar}
                disabled={guardando}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {guardando ? 'Registrando…' : 'Registrar venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
