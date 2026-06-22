'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Conteos {
  productos: number
  categorias: number
  movimientos: number
  ventas: number
  cotizaciones: number
}

interface Propiedades {
  conteos: Conteos
}

const FRASE = 'RESTABLECER'

export default function BotonRestablecerDatos({ conteos }: Propiedades) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [confirmacion, setConfirmacion] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<Conteos | null>(null)

  const totalRegistros =
    conteos.productos +
    conteos.categorias +
    conteos.movimientos +
    conteos.ventas +
    conteos.cotizaciones

  const cerrar = () => {
    if (trabajando) return
    setAbierto(false)
    setConfirmacion('')
    setError('')
  }

  const ejecutar = async () => {
    if (confirmacion !== FRASE) {
      setError(`Debes escribir "${FRASE}" exactamente como aparece.`)
      return
    }
    setTrabajando(true)
    setError('')
    try {
      const r = await fetch('/api/admin/restablecer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmacion }),
      })
      if (r.ok) {
        const data = await r.json()
        setResultado(data.borrados as Conteos)
        setAbierto(false)
        setConfirmacion('')
        // Refresca la pagina para que los conteos vuelvan a cero.
        router.refresh()
      } else {
        const e = await r.json().catch(() => ({}))
        setError(e.error || 'No se pudo restablecer la base de datos.')
      }
    } catch {
      setError('Error de red al restablecer.')
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Resumen de estado actual */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        {(
          [
            ['Productos', conteos.productos],
            ['Categorías', conteos.categorias],
            ['Movimientos', conteos.movimientos],
            ['Ventas', conteos.ventas],
            ['Cotizaciones', conteos.cotizaciones],
          ] as [string, number][]
        ).map(([etiqueta, n]) => (
          <div key={etiqueta} className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="text-xs text-gray-500 uppercase">{etiqueta}</div>
            <div className="text-lg font-semibold text-gray-800">{n}</div>
          </div>
        ))}
      </div>

      {resultado && (
        <div className="border border-emerald-300 bg-emerald-50 rounded-md p-4 text-sm text-emerald-800">
          <div className="font-semibold">Base de datos restablecida.</div>
          <div className="mt-1">
            Se borraron {resultado.productos} producto(s), {resultado.categorias} categoría(s),{' '}
            {resultado.movimientos} movimiento(s), {resultado.ventas} venta(s) y{' '}
            {resultado.cotizaciones} cotización(es). Tus usuarios, permisos y registros de
            auditoría se conservaron.
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={totalRegistros === 0}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {totalRegistros === 0
          ? 'La base ya está vacía'
          : `Restablecer (${totalRegistros} registros) →`}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={cerrar}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-bold text-red-700">
                ⚠️ Restablecer base de datos
              </h3>
              <p className="text-sm text-gray-700 mt-2">
                Esta acción borrará <strong>todo</strong> el contenido transaccional
                del aplicativo:
              </p>
              <ul className="text-sm text-gray-700 mt-2 list-disc list-inside space-y-0.5">
                <li>{conteos.productos} producto(s)</li>
                <li>{conteos.categorias} categoría(s)</li>
                <li>{conteos.movimientos} movimiento(s)</li>
                <li>{conteos.ventas} venta(s)</li>
                <li>{conteos.cotizaciones} cotización(es)</li>
              </ul>
              <p className="text-sm text-emerald-800 mt-2">
                ✓ Tus usuarios, permisos y registros de auditoría se mantienen.
              </p>
              <p className="text-sm text-red-700 mt-2 font-semibold">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Para confirmar, escribe <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-red-700">{FRASE}</code>
              </label>
              <input
                type="text"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                autoFocus
                placeholder={FRASE}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
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
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutar}
                disabled={trabajando || confirmacion !== FRASE}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold disabled:opacity-50"
              >
                {trabajando ? 'Restableciendo…' : 'Restablecer ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
