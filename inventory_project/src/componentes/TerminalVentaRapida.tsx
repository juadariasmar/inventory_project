'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatearHora } from '@/lib/fechas'
import {
  agregarAlCarrito,
  actualizarCantidad,
  cantidadTotalCarrito,
  EVENTO_CARRITO_CAMBIO,
  ItemCarrito,
  limpiarCarrito,
  obtenerCarrito,
  quitarDelCarrito,
  totalCarrito,
} from '@/lib/carrito'

interface ProductoLite {
  id: number
  codigo: string
  nombre: string
  precio: number
  cantidad: number
}

interface Propiedades {
  productos: ProductoLite[]
}

interface VentaReciente {
  ventaId: number
  totalItems: number
  totalUnidades: number
  total: number
  hora: string
}

const STORAGE_KEY_RECIENTES = 'venta-rapida:ventas-recientes'

export default function TerminalVentaRapida({ productos }: Propiedades) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<ProductoLite | null>(null)
  const [cantidad, setCantidad] = useState('1')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [recientes, setRecientes] = useState<VentaReciente[]>([])
  const [abierto, setAbierto] = useState(false)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_RECIENTES)
      if (raw) setRecientes(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_RECIENTES, JSON.stringify(recientes))
    } catch {}
  }, [recientes])

  // Sincronizar carrito desde sessionStorage al montar y cuando cambie.
  useEffect(() => {
    setCarrito(obtenerCarrito())
    const onCambio = () => setCarrito(obtenerCarrito())
    window.addEventListener(EVENTO_CARRITO_CAMBIO, onCambio)
    return () => window.removeEventListener(EVENTO_CARRITO_CAMBIO, onCambio)
  }, [])

  const opciones = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q || seleccionado) return productos
    return productos.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q)
    )
  }, [busqueda, productos, seleccionado])

  const resultados = !seleccionado && busqueda.trim() ? opciones : []

  useEffect(() => {
    if (!abierto) return
    const cerrarSiClicFuera = (e: MouseEvent) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', cerrarSiClicFuera)
    return () => document.removeEventListener('mousedown', cerrarSiClicFuera)
  }, [abierto])

  const seleccionar = (p: ProductoLite) => {
    setSeleccionado(p)
    setBusqueda(`${p.codigo} - ${p.nombre}`)
    setCantidad('1')
    setError('')
    setExito('')
    setAbierto(false)
  }

  const manejarTeclaBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && resultados.length > 0 && !seleccionado) {
      e.preventDefault()
      seleccionar(resultados[0])
    } else if (e.key === 'Escape') {
      setAbierto(false)
    } else if (e.key === 'ArrowDown' && !abierto) {
      setAbierto(true)
    }
  }

  const limpiarBuscador = () => {
    setBusqueda('')
    setSeleccionado(null)
    setCantidad('1')
    setError('')
  }

  const agregarAlCarritoBoton = () => {
    setError('')
    if (!seleccionado) {
      setError('Selecciona un producto antes de agregar al carrito.')
      return
    }
    const cant = parseInt(cantidad)
    if (!cant || cant <= 0) {
      setError('La cantidad debe ser mayor a cero.')
      return
    }
    const resultado = agregarAlCarrito(
      {
        productoId: seleccionado.id,
        codigo: seleccionado.codigo,
        nombre: seleccionado.nombre,
        precio: seleccionado.precio,
        stock: seleccionado.cantidad,
      },
      cant
    )
    if (!resultado.ok) {
      setError(resultado.mensaje ?? 'No se pudo agregar al carrito.')
      return
    }
    limpiarBuscador()
  }

  const cambiarCantidadItem = (productoId: number, valor: string) => {
    const cant = parseInt(valor)
    if (Number.isNaN(cant)) return
    if (cant <= 0) {
      quitarDelCarrito(productoId)
    } else {
      actualizarCantidad(productoId, cant)
    }
  }

  const cobrar = async () => {
    setError('')
    setExito('')
    if (carrito.length === 0) {
      setError('El carrito está vacío.')
      return
    }
    setGuardando(true)
    try {
      const resp = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: carrito.map((it) => ({ productoId: it.productoId, cantidad: it.cantidad })),
          notas: notas || undefined,
        }),
      })
      if (resp.ok) {
        const venta = await resp.json()
        const total = totalCarrito(carrito)
        const totalUnidades = cantidadTotalCarrito(carrito)
        const totalItems = carrito.length
        const hora = formatearHora(new Date())
        setRecientes((prev) =>
          [
            { ventaId: venta.id, total, totalItems, totalUnidades, hora },
            ...prev,
          ].slice(0, 5)
        )
        setExito(
          `Venta #${venta.id} registrada: ${totalUnidades} unidades por $${total.toLocaleString('es-MX')}.`
        )
        limpiarCarrito()
        setNotas('')
        limpiarBuscador()
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

  const totalGeneral = totalCarrito(carrito)
  const unidadesGeneral = cantidadTotalCarrito(carrito)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna principal: buscador + carrito */}
      <div className="lg:col-span-2 space-y-4">
        {/* Buscador */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {exito && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-md text-sm">
              {exito}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto (escribe para buscar o abre el listado)
            </label>
            <div className="relative" ref={contenedorRef}>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setSeleccionado(null)
                  setAbierto(true)
                }}
                onFocus={() => setAbierto(true)}
                onKeyDown={manejarTeclaBusqueda}
                autoFocus
                placeholder="Escribe para buscar o haz clic en ▾ para ver todos"
                className="w-full px-3 py-3 pr-10 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setAbierto((v) => !v)}
                aria-label="Abrir listado de productos"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-gray-500 hover:text-gray-800"
              >
                <span className={`inline-block transition-transform ${abierto ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>
              {abierto && opciones.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
                  {opciones.map((p, i) => {
                    const esPrimera = !seleccionado && busqueda.trim() && i === 0
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => seleccionar(p)}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
                          esPrimera ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-900">{p.nombre}</div>
                            <div className="text-xs text-gray-500">
                              {p.codigo} · Stock: {p.cantidad}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-emerald-700">
                            ${p.precio.toLocaleString('es-MX')}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              {abierto && opciones.length === 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500">
                  Sin coincidencias
                </div>
              )}
            </div>
          </div>

          {seleccionado && (
            <div className="bg-gray-50 p-4 rounded-md grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">Stock disponible</div>
                <div className="font-semibold">{seleccionado.cantidad}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Precio unitario</div>
                <div className="font-semibold">
                  ${seleccionado.precio.toLocaleString('es-MX')}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min={1}
                max={seleccionado?.cantidad}
                className="w-full px-3 py-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={limpiarBuscador}
                disabled={!seleccionado || guardando}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={agregarAlCarritoBoton}
                disabled={!seleccionado || guardando}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-base font-semibold"
              >
                + Agregar al carrito
              </button>
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <div className="flex justify-between items-baseline">
            <h2 className="text-lg font-bold text-gray-800">Carrito</h2>
            <div className="text-sm text-gray-500">
              {carrito.length} producto(s) · {unidadesGeneral} unidad(es)
            </div>
          </div>

          {carrito.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              Tu carrito está vacío. Busca un producto arriba o usa el botón{' '}
              <span className="font-semibold">Vender</span> en la lista de productos.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Producto</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Precio</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">Cantidad</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Subtotal</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {carrito.map((it) => (
                      <tr key={it.productoId}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{it.nombre}</div>
                          <div className="text-xs text-gray-500">{it.codigo}</div>
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          ${it.precio.toLocaleString('es-MX')}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min={1}
                            max={it.stock}
                            value={it.cantidad}
                            onChange={(e) => cambiarCantidadItem(it.productoId, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                          ${(it.precio * it.cantidad).toLocaleString('es-MX')}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => quitarDelCarrito(it.productoId)}
                            className="text-red-600 hover:text-red-800"
                            title="Quitar del carrito"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={limpiarCarrito}
                  className="text-sm text-gray-500 hover:text-red-600 underline"
                >
                  Vaciar carrito
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar: resumen + cobrar + recientes */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <h2 className="text-lg font-bold text-gray-800">Resumen de venta</h2>
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
            <div className="text-xs text-gray-600">Total a cobrar</div>
            <div className="text-3xl font-bold text-emerald-700">
              ${totalGeneral.toLocaleString('es-MX')}
            </div>
            {carrito.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {carrito.length} producto(s) · {unidadesGeneral} unidad(es)
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Cliente, factura, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={cobrar}
            disabled={guardando || carrito.length === 0}
            className="w-full px-4 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-lg font-semibold"
          >
            {guardando ? 'Cobrando…' : 'Cobrar'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Ventas recientes en esta sesión
          </h2>
          {recientes.length === 0 ? (
            <p className="text-sm text-gray-500">
              No has registrado ventas en esta sesión.
            </p>
          ) : (
            <ul className="space-y-3">
              {recientes.map((v) => (
                <li
                  key={v.ventaId}
                  className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      Venta #{v.ventaId}
                    </div>
                    <div className="text-xs text-gray-500">
                      {v.totalItems} producto(s) · {v.totalUnidades} ud · {v.hora}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-700 ml-2 whitespace-nowrap">
                    ${v.total.toLocaleString('es-MX')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
