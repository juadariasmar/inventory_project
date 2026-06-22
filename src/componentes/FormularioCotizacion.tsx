'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

interface ProductoCotizacion {
  id: number
  codigo: string
  nombre: string
  precio: number
  cantidad: number       // stock fisico
  disponible: number     // fisico - reservado en otras cotizaciones
}

interface Propiedades {
  productos: ProductoCotizacion[]
}

interface ItemCarrito {
  productoId: number
  cantidad: number
}

const DIAS_VALIDEZ_DEFECTO = 7

export default function FormularioCotizacion({ productos }: Propiedades) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [items, setItems] = useState<ItemCarrito[]>([])
  const [cliente, setCliente] = useState('')
  const [diasValidez, setDiasValidez] = useState(DIAS_VALIDEZ_DEFECTO)
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const mapaProductos = useMemo(
    () => new Map(productos.map((p) => [p.id, p])),
    [productos]
  )

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return productos.slice(0, 30)
    return productos
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q)
      )
      .slice(0, 30)
  }, [productos, busqueda])

  const agregar = (productoId: number) => {
    setItems((prev) => {
      const existente = prev.find((it) => it.productoId === productoId)
      const producto = mapaProductos.get(productoId)
      const max = producto?.disponible ?? 0
      if (existente) {
        if (existente.cantidad >= max) return prev
        return prev.map((it) =>
          it.productoId === productoId ? { ...it, cantidad: it.cantidad + 1 } : it
        )
      }
      if (max <= 0) return prev
      return [...prev, { productoId, cantidad: 1 }]
    })
    setError('')
  }

  const cambiarCantidad = (productoId: number, nueva: number) => {
    const max = mapaProductos.get(productoId)?.disponible ?? 0
    const limpia = Math.max(0, Math.min(max, Math.floor(nueva) || 0))
    if (limpia === 0) {
      setItems((prev) => prev.filter((it) => it.productoId !== productoId))
    } else {
      setItems((prev) =>
        prev.map((it) =>
          it.productoId === productoId ? { ...it, cantidad: limpia } : it
        )
      )
    }
  }

  const eliminar = (productoId: number) => {
    setItems((prev) => prev.filter((it) => it.productoId !== productoId))
  }

  const total = items.reduce((s, it) => {
    const p = mapaProductos.get(it.productoId)
    return s + (p?.precio ?? 0) * it.cantidad
  }, 0)

  const crearCotizacion = async () => {
    if (items.length === 0) {
      setError('Agrega al menos un producto.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const r = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({
            productoId: it.productoId,
            cantidad: it.cantidad,
          })),
          cliente,
          notas,
          diasValidez,
        }),
      })
      if (r.ok) {
        const cotizacion = await r.json()
        router.push(`/cotizaciones/${cotizacion.id}`)
        router.refresh()
      } else {
        const e = await r.json().catch(() => ({}))
        setError(e.error || 'No se pudo crear la cotización.')
        setGuardando(false)
      }
    } catch {
      setError('Error al crear la cotización.')
      setGuardando(false)
    }
  }

  if (productos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        No hay productos registrados. Primero crea al menos un producto en la
        sección de Productos.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna principal: buscador + carrito */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <h2 className="text-lg font-bold text-gray-800">Productos</h2>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código…"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-md">
            {productosFiltrados.map((p) => {
              const enCarrito = items.find((it) => it.productoId === p.id)?.cantidad ?? 0
              const sinDisponible = p.disponible <= 0
              const restante = p.disponible - enCarrito
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => agregar(p.id)}
                  disabled={sinDisponible || restante <= 0}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed flex justify-between items-center"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {p.nombre}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{p.codigo}</div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-semibold text-gray-800">
                      ${p.precio.toLocaleString('es-MX')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Disp: {p.disponible}
                      {p.disponible !== p.cantidad && (
                        <span className="ml-1 text-amber-700">
                          (físico {p.cantidad})
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
            {productosFiltrados.length === 0 && (
              <p className="text-sm text-gray-500 px-3 py-4 text-center">
                Sin resultados.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <div className="flex justify-between items-baseline">
            <h2 className="text-lg font-bold text-gray-800">Items de la cotización</h2>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Vaciar
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              Aún no hay productos. Selecciona uno de la lista de arriba.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
              {items.map((it) => {
                const p = mapaProductos.get(it.productoId)
                if (!p) return null
                return (
                  <li
                    key={it.productoId}
                    className="px-3 py-2 grid grid-cols-[1fr_90px_90px_auto] items-center gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 truncate">{p.nombre}</div>
                      <div className="text-xs text-gray-500 font-mono">{p.codigo}</div>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(it.productoId, it.cantidad - 1)}
                        className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100 text-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={it.cantidad}
                        min={1}
                        max={p.disponible}
                        onChange={(e) =>
                          cambiarCantidad(it.productoId, parseInt(e.target.value) || 0)
                        }
                        className="w-12 text-center border border-gray-300 rounded text-sm py-1"
                      />
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(it.productoId, it.cantidad + 1)}
                        disabled={it.cantidad >= p.disponible}
                        className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100 text-sm disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right font-semibold text-gray-800">
                      ${(p.precio * it.cantidad).toLocaleString('es-MX')}
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminar(it.productoId)}
                      className="text-red-600 hover:text-red-800 text-sm px-1"
                      title="Quitar"
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Sidebar: datos + total */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <h2 className="text-lg font-bold text-gray-800">Datos de la cotización</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Válida por (días)
            </label>
            <input
              type="number"
              value={diasValidez}
              min={1}
              max={365}
              onChange={(e) => setDiasValidez(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Después de ese plazo la reserva de stock se libera.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <h2 className="text-lg font-bold text-gray-800">Resumen</h2>
          <div className="flex justify-between text-sm text-gray-700">
            <span>{items.length} producto{items.length !== 1 ? 's' : ''}</span>
            <span>
              {items.reduce((s, it) => s + it.cantidad, 0)} unidad
              {items.reduce((s, it) => s + it.cantidad, 0) !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="flex justify-between items-baseline border-t pt-3">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-2xl font-bold text-blue-700">
              ${total.toLocaleString('es-MX')}
            </span>
          </div>
          {error && (
            <p className="text-sm bg-red-50 text-red-800 border border-red-200 p-2 rounded">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={crearCotizacion}
            disabled={guardando || items.length === 0}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:opacity-50"
          >
            {guardando ? 'Creando…' : 'Crear cotización'}
          </button>
          <p className="text-xs text-gray-500">
            La cotización reserva el stock mientras está vigente. No descuenta
            el inventario hasta que se convierta en venta.
          </p>
        </div>
      </div>
    </div>
  )
}
