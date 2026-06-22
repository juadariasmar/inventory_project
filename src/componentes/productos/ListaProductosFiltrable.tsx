'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import BarraSeleccionMultiple from '@/componentes/comunes/BarraSeleccionMultiple'
import BotonEliminarProducto from '@/componentes/productos/BotonEliminarProducto'
import BotonVenderProducto from '@/componentes/productos/BotonVenderProducto'
import MenuDesplegableAcciones from '@/componentes/comunes/MenuDesplegableAcciones'
import { estadoStock, etiquetaEstadoStock, type EstadoStock } from '@/lib/inventario'
import { diasDesde, formatearAntiguedad, formatearFecha } from '@/lib/fechas'

interface ProductoFilaProps {
  id: number
  codigo: string
  nombre: string
  precio: number
  cantidad: number
  stockMinimo: number
  categoria: { id: number; nombre: string } | null
  // Fecha de creacion serializada desde el server (Date no cruza el boundary).
  creadoEn: Date | string
}

interface CategoriaLite {
  id: number
  nombre: string
}

interface Propiedades {
  productos: ProductoFilaProps[]
  categorias: CategoriaLite[]
  esAdmin: boolean
  puedeVender: boolean
}

const CLASES_ESTADO: Record<EstadoStock, string> = {
  sin_stock: 'bg-gray-200 text-gray-800',
  stock_bajo: 'bg-red-100 text-red-800',
  normal: 'bg-green-100 text-green-800',
}

type Estado = 'todos' | EstadoStock
type CampoOrden = 'nombre' | 'codigo' | 'precio' | 'stock' | 'antiguedad'
type Dir = 'asc' | 'desc'
type RangoAntiguedad = 'todos' | 'd7' | 'd30' | 'd90' | 'viejos'

const CATEGORIA_TODAS = 'todas'
const CATEGORIA_SIN = 'sin'

const LIMITES_ANTIGUEDAD: Record<Exclude<RangoAntiguedad, 'todos'>, number> = {
  d7: 7,
  d30: 30,
  d90: 90,
  viejos: 90, // se trata especial: dias > 90
}

export default function ListaProductosFiltrable({
  productos,
  categorias,
  esAdmin,
  puedeVender,
}: Propiedades) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [cat, setCat] = useState<string>(searchParams.get('cat') ?? CATEGORIA_TODAS)
  const [estado, setEstado] = useState<Estado>(
    (searchParams.get('estado') as Estado) ?? 'todos'
  )
  const [rangoAntiguedad, setRangoAntiguedad] = useState<RangoAntiguedad>(
    (searchParams.get('antig') as RangoAntiguedad) ?? 'todos'
  )
  const [campoOrden, setCampoOrden] = useState<CampoOrden>(
    (searchParams.get('orden')?.split('-')[0] as CampoOrden) ?? 'nombre'
  )
  const [dir, setDir] = useState<Dir>(
    (searchParams.get('orden')?.split('-')[1] as Dir) ?? 'asc'
  )
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())
  const [eliminandoBulk, setEliminandoBulk] = useState(false)

  // Persistir filtros en URL (sin recargar)
  useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (cat !== CATEGORIA_TODAS) params.set('cat', cat)
    if (estado !== 'todos') params.set('estado', estado)
    if (rangoAntiguedad !== 'todos') params.set('antig', rangoAntiguedad)
    if (campoOrden !== 'nombre' || dir !== 'asc') params.set('orden', `${campoOrden}-${dir}`)
    const qs = params.toString()
    router.replace(qs ? `/productos?${qs}` : '/productos', { scroll: false })
  }, [q, cat, estado, rangoAntiguedad, campoOrden, dir, router])

  const productosFiltrados = useMemo(() => {
    const busq = q.trim().toLowerCase()
    const ahora = new Date()
    let lista = productos.filter((p) => {
      if (busq) {
        const enNombre = p.nombre.toLowerCase().includes(busq)
        const enCodigo = p.codigo.toLowerCase().includes(busq)
        if (!enNombre && !enCodigo) return false
      }
      if (cat === CATEGORIA_SIN) {
        if (p.categoria) return false
      } else if (cat !== CATEGORIA_TODAS) {
        if (!p.categoria || String(p.categoria.id) !== cat) return false
      }
      if (estado !== 'todos') {
        const e = estadoStock(p)
        if (e !== estado) return false
      }
      if (rangoAntiguedad !== 'todos') {
        const dias = diasDesde(p.creadoEn, ahora)
        if (rangoAntiguedad === 'viejos') {
          if (dias <= LIMITES_ANTIGUEDAD.viejos) return false
        } else {
          if (dias > LIMITES_ANTIGUEDAD[rangoAntiguedad]) return false
        }
      }
      return true
    })
    const factor = dir === 'asc' ? 1 : -1
    lista = [...lista].sort((a, b) => {
      let av: string | number
      let bv: string | number
      switch (campoOrden) {
        case 'codigo':
          av = a.codigo.toLowerCase(); bv = b.codigo.toLowerCase(); break
        case 'precio':
          av = a.precio; bv = b.precio; break
        case 'stock':
          av = a.cantidad; bv = b.cantidad; break
        case 'antiguedad':
          // asc = mas viejos primero (creadoEn ascendente)
          av = new Date(a.creadoEn).getTime()
          bv = new Date(b.creadoEn).getTime()
          break
        default:
          av = a.nombre.toLowerCase(); bv = b.nombre.toLowerCase()
      }
      if (av < bv) return -1 * factor
      if (av > bv) return 1 * factor
      return 0
    })
    return lista
  }, [productos, q, cat, estado, rangoAntiguedad, campoOrden, dir])

  const hayFiltrosActivos =
    q.trim() !== '' ||
    cat !== CATEGORIA_TODAS ||
    estado !== 'todos' ||
    rangoAntiguedad !== 'todos'

  const limpiarFiltros = () => {
    setQ('')
    setCat(CATEGORIA_TODAS)
    setEstado('todos')
    setRangoAntiguedad('todos')
  }

  const ordenarPor = (campo: CampoOrden) => {
    if (campoOrden === campo) {
      setDir(dir === 'asc' ? 'desc' : 'asc')
    } else {
      setCampoOrden(campo)
      setDir('asc')
    }
  }

  const flechaOrden = (campo: CampoOrden) =>
    campoOrden === campo ? (dir === 'asc' ? ' ↑' : ' ↓') : ''

  // --- Seleccion multiple ---
  const idsEnVista = productosFiltrados.map((p) => p.id)
  const seleccionadosEnVista = idsEnVista.filter((id) => seleccionados.has(id))
  const todosSeleccionados =
    idsEnVista.length > 0 && seleccionadosEnVista.length === idsEnVista.length
  const algunosSeleccionados =
    seleccionadosEnVista.length > 0 && !todosSeleccionados

  const togglearProducto = (id: number) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }
  const togglearTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados((prev) => {
        const nuevo = new Set(prev)
        idsEnVista.forEach((id) => nuevo.delete(id))
        return nuevo
      })
    } else {
      setSeleccionados((prev) => {
        const nuevo = new Set(prev)
        idsEnVista.forEach((id) => nuevo.add(id))
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
        `¿Eliminar ${ids.length} producto(s)?\n\nSe borrarán también todos sus movimientos. Si alguno tiene ventas o cotizaciones asociadas, no se borrará ninguno.`
      )
    ) {
      return
    }
    setEliminandoBulk(true)
    try {
      const r = await fetch('/api/productos/bulk-delete', {
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
      {/* Barra de filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre o código…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Categoría
            </label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={CATEGORIA_TODAS}>Todas</option>
              <option value={CATEGORIA_SIN}>Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as Estado)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="sin_stock">Sin stock</option>
              <option value="stock_bajo">Stock bajo</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Antigüedad
            </label>
            <select
              value={rangoAntiguedad}
              onChange={(e) => setRangoAntiguedad(e.target.value as RangoAntiguedad)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todas</option>
              <option value="d7">Últimos 7 días</option>
              <option value="d30">Últimos 30 días</option>
              <option value="d90">Últimos 90 días</option>
              <option value="viejos">Más de 90 días</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
          <span className="text-gray-600">
            Mostrando <strong>{productosFiltrados.length}</strong> de{' '}
            <strong>{productos.length}</strong> productos
          </span>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-blue-600 hover:text-blue-800 underline self-start sm:self-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {productosFiltrados.length > 0 ? (
          <>
            {/* Vista escritorio */}
            <div className="hidden lg:block">
              <table className="w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    {esAdmin && (
                      <th className="px-3 py-3 w-[3%]">
                        <input
                          type="checkbox"
                          checked={todosSeleccionados}
                          ref={(el) => {
                            if (el) el.indeterminate = algunosSeleccionados
                          }}
                          onChange={togglearTodos}
                          title={todosSeleccionados ? 'Quitar selección' : 'Seleccionar todos los visibles'}
                          className="cursor-pointer"
                        />
                      </th>
                    )}
                    <th
                      onClick={() => ordenarPor('codigo')}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 w-[8%]"
                    >
                      Código{flechaOrden('codigo')}
                    </th>
                    <th
                      onClick={() => ordenarPor('nombre')}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 w-[16%]"
                    >
                      Nombre{flechaOrden('nombre')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                      Categoría
                    </th>
                    <th
                      onClick={() => ordenarPor('precio')}
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 w-[8%]"
                    >
                      Precio{flechaOrden('precio')}
                    </th>
                    <th
                      onClick={() => ordenarPor('stock')}
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 w-[6%]"
                    >
                      Cant.{flechaOrden('stock')}
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[9%]">
                      Valor stock
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                      Estado
                    </th>
                    <th
                      onClick={() => ordenarPor('antiguedad')}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 w-[12%]"
                      title="Ordenar por fecha de creación"
                    >
                      Antigüedad{flechaOrden('antiguedad')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[23%]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosFiltrados.map((producto) => {
                    const e = estadoStock(producto)
                    const sel = seleccionados.has(producto.id)
                    return (
                      <tr
                        key={producto.id}
                        className={`hover:bg-gray-50 ${sel ? 'bg-blue-50' : ''}`}
                      >
                        {esAdmin && (
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => togglearProducto(producto.id)}
                              className="cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 truncate">
                          {producto.codigo}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 break-words">
                          {producto.nombre}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 break-words">
                          {producto.categoria?.nombre || 'Sin categoría'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                          ${producto.precio.toLocaleString('es-MX')}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                          {producto.cantidad}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          ${(producto.precio * producto.cantidad).toLocaleString('es-MX')}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${CLASES_ESTADO[e]}`}
                          >
                            {etiquetaEstadoStock(e)}
                          </span>
                        </td>
                        <td
                          className="px-3 py-3 whitespace-nowrap text-sm text-gray-700"
                          title={formatearFecha(producto.creadoEn)}
                        >
                          <div>{formatearAntiguedad(producto.creadoEn)}</div>
                          <div className="text-xs text-gray-400">
                            {formatearFecha(producto.creadoEn)}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm flex items-center justify-end gap-2 whitespace-nowrap">
                          {puedeVender && (
                            <BotonVenderProducto
                              id={producto.id}
                              nombre={producto.nombre}
                              codigo={producto.codigo}
                              stockActual={producto.cantidad}
                              precio={producto.precio}
                            />
                          )}
                          <MenuDesplegableAcciones>
                            <div className="px-4 py-2 hover:bg-gray-100">
                              <Link href={`/productos/${producto.id}/detalle`} className="text-gray-700 block w-full text-left">
                                Histórico
                              </Link>
                            </div>
                            {esAdmin && (
                              <>
                                <div className="px-4 py-2 hover:bg-gray-100">
                                  <Link href={`/productos/${producto.id}`} className="text-blue-600 block w-full text-left">
                                    Editar
                                  </Link>
                                </div>
                                <div className="px-4 py-2 hover:bg-gray-100">
                                  <BotonEliminarProducto id={producto.id} nombre={producto.nombre} />
                                </div>
                              </>
                            )}
                          </MenuDesplegableAcciones>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista móvil */}
            <div className="lg:hidden divide-y divide-gray-200">
              {productosFiltrados.map((producto) => {
                const e = estadoStock(producto)
                const sel = seleccionados.has(producto.id)
                return (
                  <div key={producto.id} className={`p-4 ${sel ? 'bg-blue-50' : ''}`}>
                    <div className="flex justify-between items-start gap-2">
                      {esAdmin && (
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => togglearProducto(producto.id)}
                          className="mt-1 cursor-pointer"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {producto.nombre}
                        </div>
                        <div className="text-xs text-gray-500">
                          {producto.codigo}
                          {producto.categoria?.nombre && (
                            <> · {producto.categoria.nombre}</>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${CLASES_ESTADO[e]}`}
                      >
                        {etiquetaEstadoStock(e)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Precio</div>
                        <div className="font-medium">
                          ${producto.precio.toLocaleString('es-MX')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Cantidad</div>
                        <div className="font-medium">{producto.cantidad}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Valor en stock</div>
                        <div className="font-medium">
                          ${(producto.precio * producto.cantidad).toLocaleString('es-MX')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Antigüedad</div>
                        <div className="font-medium" title={formatearFecha(producto.creadoEn)}>
                          {formatearAntiguedad(producto.creadoEn)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                      {puedeVender && (
                        <BotonVenderProducto
                          id={producto.id}
                          nombre={producto.nombre}
                          codigo={producto.codigo}
                          stockActual={producto.cantidad}
                          precio={producto.precio}
                        />
                      )}
                      <MenuDesplegableAcciones>
                        <div className="px-4 py-2 hover:bg-gray-100">
                          <Link href={`/productos/${producto.id}/detalle`} className="text-gray-700 block w-full text-left">
                            Histórico
                          </Link>
                        </div>
                        {esAdmin && (
                          <>
                            <div className="px-4 py-2 hover:bg-gray-100">
                              <Link href={`/productos/${producto.id}`} className="text-blue-600 block w-full text-left">
                                Editar
                              </Link>
                            </div>
                            <div className="px-4 py-2 hover:bg-gray-100">
                              <BotonEliminarProducto id={producto.id} nombre={producto.nombre} />
                            </div>
                          </>
                        )}
                      </MenuDesplegableAcciones>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {hayFiltrosActivos ? (
              <>
                No hay productos que coincidan con los filtros.{' '}
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-blue-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                No hay productos registrados.
                {esAdmin && (
                  <>
                    {' '}
                    <Link href="/productos/nuevo" className="text-blue-600 hover:underline">
                      Agregar uno nuevo
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {esAdmin && (
        <BarraSeleccionMultiple
          cantidad={seleccionados.size}
          etiquetaItem="producto"
          onEliminar={eliminarSeleccionados}
          onLimpiar={limpiarSeleccion}
          trabajando={eliminandoBulk}
        />
      )}
    </div>
  )
}
