'use client'

import { useMemo, useState } from 'react'

export interface FilaInventario {
  productoId: number
  codigo: string
  nombre: string
  categoria: string
  cantidad: number
  valorEnStock: number
  estado: 'Sin stock' | 'Stock bajo' | 'Normal'
  diasDesdeUltimaActividad: number | null
}

interface Propiedades {
  datos: FilaInventario[]
}

interface GrupoCategoria {
  categoria: string
  productos: FilaInventario[]
  productosCount: number
  valorTotal: number
  sinStock: number
  stockBajo: number
}

function normalizarBusqueda(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export default function InventarioGeneralAgrupado({ datos }: Propiedades) {
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())
  const [busqueda, setBusqueda] = useState('')

  const datosFiltrados = useMemo(() => {
    const q = normalizarBusqueda(busqueda)
    if (!q) return datos
    return datos.filter(
      (d) =>
        normalizarBusqueda(d.nombre).includes(q) ||
        d.codigo.toLowerCase().includes(q) ||
        normalizarBusqueda(d.categoria).includes(q)
    )
  }, [datos, busqueda])

  const grupos = useMemo<GrupoCategoria[]>(() => {
    const mapa = new Map<string, GrupoCategoria>()
    for (const fila of datosFiltrados) {
      const g = mapa.get(fila.categoria) ?? {
        categoria: fila.categoria,
        productos: [],
        productosCount: 0,
        valorTotal: 0,
        sinStock: 0,
        stockBajo: 0,
      }
      g.productos.push(fila)
      g.productosCount += 1
      g.valorTotal += fila.valorEnStock
      if (fila.estado === 'Sin stock') g.sinStock += 1
      else if (fila.estado === 'Stock bajo') g.stockBajo += 1
      mapa.set(fila.categoria, g)
    }
    return Array.from(mapa.values()).sort((a, b) =>
      a.categoria.localeCompare(b.categoria, 'es')
    )
  }, [datosFiltrados])

  const togglear = (categoria: string) => {
    setExpandidas((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(categoria)) nuevo.delete(categoria)
      else nuevo.add(categoria)
      return nuevo
    })
  }

  const expandirTodas = () => {
    setExpandidas(new Set(grupos.map((g) => g.categoria)))
  }
  const colapsarTodas = () => {
    setExpandidas(new Set())
  }

  // Cuando hay busqueda, expandir automaticamente las que tienen matches
  const debenEstarExpandidas = useMemo(() => {
    if (busqueda.trim()) {
      return new Set(grupos.map((g) => g.categoria))
    }
    return expandidas
  }, [busqueda, expandidas, grupos])

  return (
    <div className="space-y-3">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, código o categoría…"
            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={expandirTodas}
            className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-md text-gray-700"
          >
            Expandir todo
          </button>
          <button
            type="button"
            onClick={colapsarTodas}
            className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-md text-gray-700"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {grupos.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center bg-gray-50 rounded-md">
          {busqueda
            ? `Sin resultados para "${busqueda}".`
            : 'No hay productos registrados.'}
        </p>
      ) : (
        <div className="space-y-2">
          {grupos.map((g) => {
            const expandido = debenEstarExpandidas.has(g.categoria)
            return (
              <div
                key={g.categoria}
                className="border border-gray-200 rounded-md overflow-hidden bg-white"
              >
                <button
                  type="button"
                  onClick={() => togglear(g.categoria)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-xs text-gray-400 transition-transform ${
                        expandido ? 'rotate-90' : ''
                      }`}
                    >
                      ▸
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {g.categoria}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>
                          {g.productosCount} producto
                          {g.productosCount !== 1 ? 's' : ''}
                        </span>
                        <span>
                          ${g.valorTotal.toLocaleString('es-MX')} en stock
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {g.sinStock > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                        {g.sinStock} sin stock
                      </span>
                    )}
                    {g.stockBajo > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                        {g.stockBajo} bajo
                      </span>
                    )}
                  </div>
                </button>

                {expandido && (
                  <div className="border-t border-gray-200">
                    {/* Escritorio */}
                    <div className="hidden md:block">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Producto
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Código
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Cantidad
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Valor
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Estado
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Días sin movim.
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {g.productos.map((p) => (
                            <tr key={p.productoId} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-800">
                                {p.nombre}
                              </td>
                              <td className="px-3 py-2 text-xs font-mono text-gray-600">
                                {p.codigo}
                              </td>
                              <td className="px-3 py-2 text-right">{p.cantidad}</td>
                              <td className="px-3 py-2 text-right">
                                ${p.valorEnStock.toLocaleString('es-MX')}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                    p.estado === 'Sin stock'
                                      ? 'bg-red-100 text-red-700'
                                      : p.estado === 'Stock bajo'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  {p.estado}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right text-gray-600">
                                {p.diasDesdeUltimaActividad === null
                                  ? '—'
                                  : p.diasDesdeUltimaActividad}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Móvil */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {g.productos.map((p) => (
                        <div key={p.productoId} className="p-3 text-sm">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-800 truncate">
                                {p.nombre}
                              </div>
                              <div className="text-xs font-mono text-gray-500">
                                {p.codigo}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                p.estado === 'Sin stock'
                                  ? 'bg-red-100 text-red-700'
                                  : p.estado === 'Stock bajo'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {p.estado}
                            </span>
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-gray-600">
                            <span>Cant: {p.cantidad}</span>
                            <span>${p.valorEnStock.toLocaleString('es-MX')}</span>
                            <span>
                              {p.diasDesdeUltimaActividad === null
                                ? 'Sin actividad'
                                : `${p.diasDesdeUltimaActividad}d`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
