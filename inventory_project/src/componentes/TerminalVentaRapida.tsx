'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatearHora } from '@/lib/fechas'

const STORAGE_KEY_RECIENTES = 'venta-rapida:ventas-recientes'

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
  id: number
  nombre: string
  cantidad: number
  total: number
  hora: string
}

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
  const contenedorRef = useRef<HTMLDivElement>(null)

  // Persistir ventas recientes en sessionStorage para que sobrevivan
  // al navegar fuera de /venta-rapida dentro de la misma sesion del navegador.
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

  const totalVenta = seleccionado
    ? (parseInt(cantidad) || 0) * seleccionado.precio
    : 0

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

  const limpiar = () => {
    setBusqueda('')
    setSeleccionado(null)
    setCantidad('1')
    setNotas('')
    setError('')
  }

  const registrar = async () => {
    setError('')
    setExito('')
    if (!seleccionado) {
      setError('Selecciona un producto')
      return
    }
    const cantidadNum = parseInt(cantidad)
    if (!cantidadNum || cantidadNum <= 0) {
      setError('La cantidad debe ser mayor a cero')
      return
    }
    if (cantidadNum > seleccionado.cantidad) {
      setError(`Solo hay ${seleccionado.cantidad} en stock`)
      return
    }

    setGuardando(true)
    try {
      const resp = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: seleccionado.id,
          tipo: 'salida',
          cantidad: cantidadNum,
          notas: notas || 'Venta rápida',
        }),
      })
      if (resp.ok) {
        const total = cantidadNum * seleccionado.precio
        const hora = formatearHora(new Date())
        setRecientes((prev) => [
          {
            id: seleccionado.id,
            nombre: seleccionado.nombre,
            cantidad: cantidadNum,
            total,
            hora,
          },
          ...prev,
        ].slice(0, 5))
        setExito(
          `Venta registrada: ${cantidadNum} × ${seleccionado.nombre} = $${total.toLocaleString('es-MX')}`
        )
        limpiar()
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna principal: terminal */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 space-y-4">
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
                  const esPrimeraCoincidencia =
                    !seleccionado && busqueda.trim() && i === 0
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => seleccionar(p)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
                        esPrimeraCoincidencia ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            {p.nombre}
                          </div>
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
          <div className="bg-gray-50 p-4 rounded-md space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Stock disponible:</span>
              <span className="font-semibold">{seleccionado.cantidad}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Precio unitario:</span>
              <span className="font-semibold">
                ${seleccionado.precio.toLocaleString('es-MX')}
              </span>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Venta rápida"
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {totalVenta > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
            <div className="text-xs text-gray-600">Total venta</div>
            <div className="text-3xl font-bold text-emerald-700">
              ${totalVenta.toLocaleString('es-MX')}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={limpiar}
            disabled={guardando}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={registrar}
            disabled={guardando || !seleccionado}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-lg font-semibold"
          >
            {guardando ? 'Registrando…' : 'Registrar venta'}
          </button>
        </div>
      </div>

      {/* Sidebar: ventas recientes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Ventas recientes en esta sesión
        </h2>
        {recientes.length === 0 ? (
          <p className="text-sm text-gray-500">
            No has registrado ventas en esta sesión.
          </p>
        ) : (
          <ul className="space-y-3">
            {recientes.map((v, i) => (
              <li
                key={i}
                className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {v.nombre}
                  </div>
                  <div className="text-xs text-gray-500">
                    {v.cantidad} unidad{v.cantidad === 1 ? '' : 'es'} · {v.hora}
                  </div>
                </div>
                <div className="text-sm font-semibold text-emerald-700 ml-2">
                  ${v.total.toLocaleString('es-MX')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
