'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatearFechaHora } from '@/lib/fechas'
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

interface VentaReciente {
  id: number
  total: number
  totalItems: number
  creadoEn: string
}

interface Propiedades {
  productos: ProductoLite[]
  recientes: VentaReciente[]
  totalHoy: number
  ventasHoy: number
}

export default function TerminalVentaRapida({
  productos,
  recientes,
  totalHoy,
  ventasHoy,
}: Propiedades) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<ProductoLite | null>(null)
  const [cantidad, setCantidad] = useState('1')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const contenedorRef = useRef<HTMLDivElement>(null)

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
      setError('No hay productos agregados.')
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
        setExito(
          `Venta #${venta.id} registrada: ${totalUnidades} unidades por $${total.toLocaleString('es-MX')}.`
        )
        limpiarCarrito()
        setNotas('')
        limpiarBuscador()
        // router.refresh() recarga las ventas recientes y el total del dia
        // desde la BD (que es la fuente de verdad).
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Columna principal: buscador + recientes */}
      <div className="lg:col-span-8 flex flex-col gap-6 bg-surface p-6 rounded-2xl shadow-sm border border-border">
        {/* Buscador */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Búsqueda de productos</h2>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm transition-all duration-300">
              {error}
            </div>
          )}
          {exito && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm transition-all duration-300">
              {exito}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Producto (escribe para buscar o abre el listado)
            </label>
            <div className="relative" ref={contenedorRef}>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  const v = e.target.value
                  setBusqueda(v)
                  setSeleccionado(null)
                  setAbierto(v.trim().length > 0)
                }}
                onKeyDown={manejarTeclaBusqueda}
                autoFocus
                placeholder="Escribe para buscar o haz clic en ▾ para ver todos"
                className="w-full px-4 py-3 pr-10 text-lg border border-border rounded-xl focus:outline-none bg-surface text-foreground transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setAbierto((v) => !v)}
                aria-label="Abrir listado de productos"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-gray-500 hover:text-foreground transition-colors duration-200"
              >
                <span className={`inline-block transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>
              {abierto && opciones.length > 0 && (
                <div className="absolute z-10 mt-2 w-full bg-surface border border-border rounded-xl shadow-lg max-h-72 overflow-y-auto">
                  {opciones.map((p, i) => {
                    const esPrimera = !seleccionado && busqueda.trim() && i === 0
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => seleccionar(p)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-border last:border-b-0 transition-colors duration-150 ${
                          esPrimera ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-foreground">{p.nombre}</div>
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
                <div className="absolute z-10 mt-2 w-full bg-surface border border-border rounded-xl shadow-lg px-4 py-3 text-sm text-gray-500">
                  Sin coincidencias
                </div>
              )}
            </div>
          </div>

          {seleccionado && (
            <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-2 gap-3 text-sm transition-all duration-300">
              <div>
                <div className="text-xs text-gray-500">Stock disponible</div>
                <div className="font-semibold text-foreground">{seleccionado.cantidad}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Precio unitario</div>
                <div className="font-semibold text-foreground">
                  ${seleccionado.precio.toLocaleString('es-MX')}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Cantidad
              </label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min={1}
                max={seleccionado?.cantidad}
                className="w-full px-4 py-3 text-lg border border-border rounded-xl focus:outline-none bg-surface text-foreground transition-all duration-200"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={limpiarBuscador}
                disabled={!seleccionado || guardando}
                className="px-5 py-3 border border-border text-foreground rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={agregarAlCarritoBoton}
                disabled={!seleccionado || guardando}
                className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-base font-semibold transition-all duration-200 shadow-sm"
              >
                + Agregar
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border my-2"></div>

        {/* Resumen del día y recientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total del dia */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl shadow-sm p-6 flex flex-col justify-center transition-all duration-300 hover:shadow-md">
            <div className="text-xs uppercase tracking-wider opacity-90 font-medium">
              Vendido hoy
            </div>
            <div className="text-4xl font-bold mt-2">
              ${totalHoy.toLocaleString('es-MX')}
            </div>
            <div className="text-sm opacity-90 mt-2 font-medium">
              {ventasHoy} venta{ventasHoy !== 1 ? 's' : ''} registrada{ventasHoy !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Mis ventas recientes */}
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-baseline mb-4">
              <h3 className="text-lg font-bold text-foreground">Mis ventas recientes</h3>
              <Link href="/ventas" className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200">
                Ver historial →
              </Link>
            </div>
            {recientes.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-xl flex-1 flex items-center justify-center">
                Aún no has registrado ventas.
              </p>
            ) : (
              <ul className="space-y-3 overflow-y-auto max-h-48 pr-2">
                {recientes.slice(0, 3).map((v) => (
                  <li
                    key={v.id}
                    className="rounded-xl border border-border p-4 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 bg-surface"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-emerald-700">
                          ${v.total.toLocaleString('es-MX')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Venta #{v.id} · {v.totalItems} producto(s)
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatearFechaHora(v.creadoEn)}
                        </div>
                      </div>
                      <a
                        href={`/ventas/${v.id}/recibo`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap transition-colors duration-200"
                      >
                        Recibo →
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Columna lateral: carrito y cobro */}
      <div className="lg:col-span-4 bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col gap-6 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="flex justify-between items-baseline">
          <h2 className="text-xl font-bold text-foreground">Carrito</h2>
          <div className="text-sm text-gray-500 font-medium">
            {carrito.length} item{carrito.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-border">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm">No hay productos agregados.</p>
              <p className="text-xs mt-1">Busca un producto para comenzar.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {carrito.map((it) => (
                <li key={it.productoId} className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-transparent hover:border-gray-200 transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{it.nombre}</div>
                    <div className="text-xs text-gray-500 mb-2">{it.codigo} · ${it.precio.toLocaleString('es-MX')}</div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={it.stock}
                        value={it.cantidad}
                        onChange={(e) => cambiarCantidadItem(it.productoId, e.target.value)}
                        className="w-16 px-2 py-1 text-sm border border-border rounded-lg text-center focus:outline-none bg-surface text-foreground transition-all duration-200"
                      />
                      <span className="text-xs text-gray-500">/ {it.stock} max</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={() => quitarDelCarrito(it.productoId)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Quitar del carrito"
                    >
                      ✕
                    </button>
                    <div className="font-bold text-foreground">
                      ${(it.precio * it.cantidad).toLocaleString('es-MX')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {carrito.length > 0 && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={limpiarCarrito}
              className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors duration-200"
            >
              Vaciar carrito
            </button>
          </div>
        )}

        <div className="border-t border-border"></div>

        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 transition-all duration-300">
            <div className="flex justify-between items-end">
              <div className="text-sm font-medium text-gray-600">Total a cobrar</div>
              <div className="text-xs text-gray-500">{unidadesGeneral} unidad(es)</div>
            </div>
            <div className="text-4xl font-bold text-emerald-700 mt-1">
              ${totalGeneral.toLocaleString('es-MX')}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notas adicionales
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Cliente, factura, referencia..."
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none bg-surface text-foreground text-sm transition-all duration-200"
            />
          </div>
          
          <button
            type="button"
            onClick={cobrar}
            disabled={guardando || carrito.length === 0}
            className="w-full px-4 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-xl font-bold transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
          >
            {guardando ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              'Cobrar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

