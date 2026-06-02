'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import BotonEliminarProducto from '@/componentes/BotonEliminarProducto'
import BotonVenderProducto from '@/componentes/BotonVenderProducto'
import { estadoStock, etiquetaEstadoStock, type EstadoStock } from '@/lib/inventario'

interface ProductoFilaProps {
  id: number
  codigo: string
  nombre: string
  precio: number
  cantidad: number
  stockMinimo: number
  categoria: { id: number; nombre: string } | null
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
type CampoOrden = 'nombre' | 'codigo' | 'precio' | 'stock'
type Dir = 'asc' | 'desc'

const CATEGORIA_TODAS = 'todas'
const CATEGORIA_SIN = 'sin'

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
  const [campoOrden, setCampoOrden] = useState<CampoOrden>(
    (searchParams.get('orden')?.split('-')[0] as CampoOrden) ?? 'nombre'
  )
  const [dir, setDir] = useState<Dir>(
    (searchParams.get('orden')?.split('-')[1] as Dir) ?? 'asc'
  )

  // Persistir filtros en URL (sin recargar)
  useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (cat !== CATEGORIA_TODAS) params.set('cat', cat)
    if (estado !== 'todos') params.set('estado', estado)
    if (campoOrden !== 'nombre' || dir !== 'asc') params.set('orden', `${campoOrden}-${dir}`)
    const qs = params.toString()
    router.replace(qs ? `/productos?${qs}` : '/productos', { scroll: false })
  }, [q, cat, estado, campoOrden, dir, router])

  const productosFiltrados = useMemo(() => {
    const busq = q.trim().toLowerCase()
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
        default:
          av = a.nombre.toLowerCase(); bv = b.nombre.toLowerCase()
      }
      if (av < bv) return -1 * factor
      if (av > bv) return 1 * factor
      return 0
    })
    return lista
  }, [productos, q, cat, estado, campoOrden, dir])

  const hayFiltrosActivos =
    q.trim() !== '' || cat !== CATEGORIA_TODAS || estado !== 'todos'

  const limpiarFiltros = () => {
    setQ('')
    setCat(CATEGORIA_TODAS)
    setEstado('todos')
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

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
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
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => ordenarPor('codigo')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Código{flechaOrden('codigo')}
                    </th>
                    <th
                      onClick={() => ordenarPor('nombre')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Nombre{flechaOrden('nombre')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th
                      onClick={() => ordenarPor('precio')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Precio{flechaOrden('precio')}
                    </th>
                    <th
                      onClick={() => ordenarPor('stock')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Cantidad{flechaOrden('stock')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosFiltrados.map((producto) => {
                    const e = estadoStock(producto)
                    return (
                      <tr key={producto.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {producto.codigo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {producto.categoria?.nombre || 'Sin categoría'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${producto.precio.toLocaleString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.cantidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${CLASES_ESTADO[e]}`}
                          >
                            {etiquetaEstadoStock(e)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                          {puedeVender && (
                            <BotonVenderProducto
                              id={producto.id}
                              nombre={producto.nombre}
                              codigo={producto.codigo}
                              stockActual={producto.cantidad}
                              precio={producto.precio}
                            />
                          )}
                          {esAdmin && (
                            <>
                              <Link
                                href={`/productos/${producto.id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Editar
                              </Link>
                              <BotonEliminarProducto
                                id={producto.id}
                                nombre={producto.nombre}
                              />
                            </>
                          )}
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
                return (
                  <div key={producto.id} className="p-4">
                    <div className="flex justify-between items-start gap-2">
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
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
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
                    </div>
                    <div className="mt-3 flex gap-4 text-sm">
                      {puedeVender && (
                        <BotonVenderProducto
                          id={producto.id}
                          nombre={producto.nombre}
                          codigo={producto.codigo}
                          stockActual={producto.cantidad}
                          precio={producto.precio}
                        />
                      )}
                      {esAdmin && (
                        <>
                          <Link
                            href={`/productos/${producto.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </Link>
                          <BotonEliminarProducto
                            id={producto.id}
                            nombre={producto.nombre}
                          />
                        </>
                      )}
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
    </div>
  )
}
