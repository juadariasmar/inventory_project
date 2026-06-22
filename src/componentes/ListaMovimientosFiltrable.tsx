'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import BarraSeleccionMultiple from '@/componentes/BarraSeleccionMultiple'
import { formatearFechaHora } from '@/lib/fechas'

interface MovimientoFilaProps {
  id: number
  tipo: string
  cantidad: number
  notas: string | null
  creadoEn: string | Date
  ventaId: number | null
  producto: { id: number; nombre: string; codigo: string }
}

interface Propiedades {
  movimientos: MovimientoFilaProps[]
  esAdmin?: boolean
}

type TipoFiltro = 'todos' | 'entrada' | 'salida'
type CampoOrden = 'fecha' | 'producto' | 'cantidad'
type Dir = 'asc' | 'desc'

export default function ListaMovimientosFiltrable({
  movimientos,
  esAdmin,
}: Propiedades) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())
  const [eliminandoBulk, setEliminandoBulk] = useState(false)

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [tipo, setTipo] = useState<TipoFiltro>(
    (searchParams.get('tipo') as TipoFiltro) ?? 'todos'
  )
  const [desde, setDesde] = useState(searchParams.get('desde') ?? '')
  const [hasta, setHasta] = useState(searchParams.get('hasta') ?? '')
  const [campoOrden, setCampoOrden] = useState<CampoOrden>(
    (searchParams.get('orden')?.split('-')[0] as CampoOrden) ?? 'fecha'
  )
  const [dir, setDir] = useState<Dir>(
    (searchParams.get('orden')?.split('-')[1] as Dir) ?? 'desc'
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (tipo !== 'todos') params.set('tipo', tipo)
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    if (campoOrden !== 'fecha' || dir !== 'desc') params.set('orden', `${campoOrden}-${dir}`)
    const qs = params.toString()
    router.replace(qs ? `/movimientos?${qs}` : '/movimientos', { scroll: false })
  }, [q, tipo, desde, hasta, campoOrden, dir, router])

  const filtrados = useMemo(() => {
    const busq = q.trim().toLowerCase()
    const desdeMs = desde ? new Date(desde + 'T00:00:00').getTime() : null
    const hastaMs = hasta ? new Date(hasta + 'T23:59:59.999').getTime() : null
    let lista = movimientos.filter((m) => {
      if (busq) {
        const enNombre = m.producto.nombre.toLowerCase().includes(busq)
        const enCodigo = m.producto.codigo.toLowerCase().includes(busq)
        const enNotas = (m.notas ?? '').toLowerCase().includes(busq)
        if (!enNombre && !enCodigo && !enNotas) return false
      }
      if (tipo !== 'todos' && m.tipo !== tipo) return false
      const t = new Date(m.creadoEn).getTime()
      if (desdeMs && t < desdeMs) return false
      if (hastaMs && t > hastaMs) return false
      return true
    })
    const factor = dir === 'asc' ? 1 : -1
    lista = [...lista].sort((a, b) => {
      let av: string | number, bv: string | number
      switch (campoOrden) {
        case 'producto':
          av = a.producto.nombre.toLowerCase()
          bv = b.producto.nombre.toLowerCase()
          break
        case 'cantidad':
          av = a.cantidad; bv = b.cantidad; break
        default:
          av = new Date(a.creadoEn).getTime()
          bv = new Date(b.creadoEn).getTime()
      }
      if (av < bv) return -1 * factor
      if (av > bv) return 1 * factor
      return 0
    })
    return lista
  }, [movimientos, q, tipo, desde, hasta, campoOrden, dir])

  const hayFiltros =
    q.trim() !== '' || tipo !== 'todos' || desde !== '' || hasta !== ''

  const limpiar = () => {
    setQ(''); setTipo('todos'); setDesde(''); setHasta('')
  }

  const ordenarPor = (campo: CampoOrden) => {
    if (campoOrden === campo) {
      setDir(dir === 'asc' ? 'desc' : 'asc')
    } else {
      setCampoOrden(campo)
      setDir(campo === 'fecha' ? 'desc' : 'asc')
    }
  }

  const flecha = (campo: CampoOrden) =>
    campoOrden === campo ? (dir === 'asc' ? ' ↑' : ' ↓') : ''

  // Seleccion multiple: solo movimientos manuales (sin venta)
  const idsManualesEnVista = filtrados.filter((m) => m.ventaId === null).map((m) => m.id)
  const todosManualesSeleccionados =
    idsManualesEnVista.length > 0 &&
    idsManualesEnVista.every((id) => seleccionados.has(id))

  const togglearMov = (id: number) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }
  const togglearTodosManuales = () => {
    if (todosManualesSeleccionados) {
      setSeleccionados((prev) => {
        const nuevo = new Set(prev)
        idsManualesEnVista.forEach((id) => nuevo.delete(id))
        return nuevo
      })
    } else {
      setSeleccionados((prev) => {
        const nuevo = new Set(prev)
        idsManualesEnVista.forEach((id) => nuevo.add(id))
        return nuevo
      })
    }
  }
  const limpiarSeleccion = () => setSeleccionados(new Set())

  const eliminarSeleccionados = async () => {
    const ids = Array.from(seleccionados)
    if (ids.length === 0) return
    if (
      !confirm(
        `¿Eliminar ${ids.length} movimiento(s)?\n\nSolo se borrarán los manuales. Esto NO ajusta el stock de los productos.`
      )
    )
      return
    setEliminandoBulk(true)
    try {
      const r = await fetch('/api/movimientos/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (r.ok) {
        limpiarSeleccion()
        router.refresh()
      } else {
        const e = await r.json().catch(() => ({}))
        alert(e.error || 'No se pudo eliminar.')
      }
    } catch {
      alert('Error al eliminar.')
    } finally {
      setEliminandoBulk(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Producto, código o notas…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoFiltro)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
          <span className="text-gray-600">
            Mostrando <strong>{filtrados.length}</strong> de{' '}
            <strong>{movimientos.length}</strong> movimientos
          </span>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiar}
              className="text-blue-600 hover:text-blue-800 underline self-start sm:self-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filtrados.length > 0 ? (
          <>
            {/* Vista escritorio */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {esAdmin && (
                      <th className="px-3 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={todosManualesSeleccionados}
                          onChange={togglearTodosManuales}
                          disabled={idsManualesEnVista.length === 0}
                          title={
                            idsManualesEnVista.length === 0
                              ? 'No hay movimientos manuales en la vista'
                              : 'Seleccionar todos los manuales visibles'
                          }
                          className="cursor-pointer"
                        />
                      </th>
                    )}
                    <th
                      onClick={() => ordenarPor('fecha')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Fecha{flecha('fecha')}
                    </th>
                    <th
                      onClick={() => ordenarPor('producto')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Producto{flecha('producto')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th
                      onClick={() => ordenarPor('cantidad')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Cantidad{flecha('cantidad')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtrados.map((m) => {
                    const sel = seleccionados.has(m.id)
                    const esManual = m.ventaId === null
                    return (
                    <tr key={m.id} className={`hover:bg-gray-50 ${sel ? 'bg-blue-50' : ''}`}>
                      {esAdmin && (
                        <td className="px-3 py-4">
                          {esManual ? (
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => togglearMov(m.id)}
                              className="cursor-pointer"
                            />
                          ) : (
                            <span
                              className="text-gray-300 text-xs"
                              title="Movimiento de venta — no borrable"
                            >
                              🔒
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFechaHora(m.creadoEn)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{m.producto.nombre}</div>
                        <div className="text-gray-500 text-xs">{m.producto.codigo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            m.tipo === 'entrada'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-medium ${
                            m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {m.tipo === 'entrada' ? '+' : '-'}
                          {m.cantidad}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {m.notas || '-'}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista móvil */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filtrados.map((m) => {
                const sel = seleccionados.has(m.id)
                const esManual = m.ventaId === null
                return (
                <div key={m.id} className={`p-4 ${sel ? 'bg-blue-50' : ''}`}>
                  <div className="flex justify-between items-start gap-2">
                    {esAdmin && esManual && (
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => togglearMov(m.id)}
                        className="mt-1 cursor-pointer"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {m.producto.nombre}
                      </div>
                      <div className="text-xs text-gray-500">{m.producto.codigo}</div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        m.tipo === 'entrada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-baseline">
                    <span
                      className={`text-lg font-bold ${
                        m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {m.tipo === 'entrada' ? '+' : '-'}
                      {m.cantidad}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatearFechaHora(m.creadoEn)}
                    </span>
                  </div>
                  {m.notas && (
                    <div className="mt-2 text-xs text-gray-600">{m.notas}</div>
                  )}
                </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {hayFiltros ? (
              <>
                No hay movimientos que coincidan con los filtros.{' '}
                <button
                  type="button"
                  onClick={limpiar}
                  className="text-blue-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                No hay movimientos registrados.{' '}
                <Link href="/movimientos/nuevo" className="text-blue-600 hover:underline">
                  Registrar uno nuevo
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {esAdmin && (
        <BarraSeleccionMultiple
          cantidad={seleccionados.size}
          etiquetaItem="movimiento"
          onEliminar={eliminarSeleccionados}
          onLimpiar={limpiarSeleccion}
          trabajando={eliminandoBulk}
        />
      )}
    </div>
  )
}
