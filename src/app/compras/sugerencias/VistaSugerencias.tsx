'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Package, TrendingDown, Truck } from 'lucide-react'

interface Sugerencia {
  productoId: number
  nombre: string
  codigo: string
  stockActual: number
  stockMinimo: number
  consumoDiario: number
  sugerencia: number
  proveedorSugerido: { id: number; nombre: string } | null
}

interface Proveedor {
  id: number
  nombre: string
}

export default function VistaSugerencias({ empresaId }: { empresaId: string }) {
  const router = useRouter()
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())
  const [proveedorId, setProveedorId] = useState<number | ''>('')
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/compras/sugerencias').then((r) => r.json()).then(setSugerencias)
    fetch('/api/proveedores').then((r) => r.json()).then(setProveedores)
  }, [])

  const toggle = (id: number) => {
    const next = new Set(seleccionados)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSeleccionados(next)
  }

  const seleccionarTodos = () => {
    if (seleccionados.size === sugerencias.length) setSeleccionados(new Set())
    else setSeleccionados(new Set(sugerencias.map((s) => s.productoId)))
  }

  const crearOrden = async () => {
    if (!proveedorId) { setError('Selecciona un proveedor'); return }
    if (seleccionados.size === 0) { setError('Selecciona al menos un producto'); return }

    setCreando(true)
    setError('')
    try {
      const items = sugerencias
        .filter((s) => seleccionados.has(s.productoId))
        .map((s) => ({ productoId: s.productoId, cantidad: s.sugerencia, costoUnitario: 0 }))

      const r = await fetch('/api/compras/sugerencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proveedorId, items }),
      })
      if (r.ok) {
        router.push('/proveedores/ordenes')
        router.refresh()
      } else {
        const err = await r.json()
        setError(err.error || 'Error al crear orden')
      }
    } catch {
      setError('Error al crear orden')
    } finally {
      setCreando(false)
    }
  }

  return (
    <>
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={seleccionarTodos}
            className="text-xs text-blue-600 hover:text-blue-800">
            {seleccionados.size === sugerencias.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
          <span className="text-xs text-gray-500">{seleccionados.size} seleccionados</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value ? parseInt(e.target.value, 10) : '')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Seleccionar proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={crearOrden}
            disabled={creando || seleccionados.size === 0 || !proveedorId}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            <Truck className="w-4 h-4" />
            {creando ? 'Creando...' : 'Crear orden'}
          </button>
        </div>
      </div>

      <section className="bg-white rounded-lg shadow-md p-6">
        {sugerencias.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hay sugerencias de compra. El stock está en niveles adecuados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-2 w-8">
                    <input type="checkbox" checked={seleccionados.size === sugerencias.length} onChange={seleccionarTodos}
                      className="rounded border-gray-300" />
                  </th>
                  <th className="pb-3 pr-4 font-medium">Producto</th>
                  <th className="pb-3 pr-4 font-medium text-center">Stock</th>
                  <th className="pb-3 pr-4 font-medium text-center">Mínimo</th>
                  <th className="pb-3 pr-4 font-medium text-center">Consumo/día</th>
                  <th className="pb-3 pr-4 font-medium text-center">Sugerencia</th>
                  <th className="pb-3 font-medium">Proveedor sugerido</th>
                </tr>
              </thead>
              <tbody>
                {sugerencias.map((s) => (
                  <tr key={s.productoId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-2">
                      <input type="checkbox" checked={seleccionados.has(s.productoId)} onChange={() => toggle(s.productoId)}
                        className="rounded border-gray-300" />
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-gray-900">{s.nombre}</span>
                      <span className="text-xs text-gray-400 ml-1">{s.codigo}</span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.stockActual <= s.stockMinimo ? 'text-red-600' : 'text-yellow-600'}`}>
                        <TrendingDown className="w-3 h-3" /> {s.stockActual}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center text-gray-500">{s.stockMinimo}</td>
                    <td className="py-3 pr-4 text-center text-gray-500">{s.consumoDiario}</td>
                    <td className="py-3 pr-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                        <Package className="w-4 h-4" /> {s.sugerencia}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-sm">{s.proveedorSugerido?.nombre ?? 'Sin historial'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
