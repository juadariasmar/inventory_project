'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { formatearPrecio } from '@/lib/inventario'

interface ProveedorLite {
  id: number
  nombre: string
}

interface ProductoLite {
  id: number
  nombre: string
  codigo: string
  precio: number
}

interface Propiedades {
  proveedores: ProveedorLite[]
  productos: ProductoLite[]
}

interface LineaItem {
  // Identificador local para la fila (no es el productoId).
  clave: number
  productoId: string
  cantidad: string
  costoUnitario: string
}

let contadorClaves = 0
const nuevaLinea = (): LineaItem => ({
  clave: contadorClaves++,
  productoId: '',
  cantidad: '1',
  costoUnitario: '',
})

export default function FormularioOrdenCompra({
  proveedores,
  productos,
}: Propiedades) {
  const router = useRouter()
  const [proveedorId, setProveedorId] = useState('')
  const [notas, setNotas] = useState('')
  const [lineas, setLineas] = useState<LineaItem[]>([nuevaLinea()])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const mapaProductos = useMemo(
    () => new Map(productos.map((p) => [p.id, p])),
    [productos]
  )

  const subtotalLinea = (linea: LineaItem): number => {
    const cantidad = parseInt(linea.cantidad, 10)
    const costo = parseFloat(linea.costoUnitario)
    if (Number.isNaN(cantidad) || Number.isNaN(costo)) return 0
    return cantidad * costo
  }

  const total = lineas.reduce((s, l) => s + subtotalLinea(l), 0)

  const cambiarLinea = (
    clave: number,
    campo: 'productoId' | 'cantidad' | 'costoUnitario',
    valor: string
  ) => {
    setLineas((prev) =>
      prev.map((l) => {
        if (l.clave !== clave) return l
        const actualizada = { ...l, [campo]: valor }
        // Al elegir producto, sugerir el precio como costo si está vacío.
        if (campo === 'productoId' && !l.costoUnitario && valor) {
          const productoId = parseInt(valor, 10)
          if (!Number.isNaN(productoId)) {
            const producto = mapaProductos.get(productoId)
            if (producto) actualizada.costoUnitario = String(producto.precio)
          }
        }
        return actualizada
      })
    )
  }

  const agregarItem = () => {
    setLineas((prev) => [...prev, nuevaLinea()])
  }

  const quitarItem = (clave: number) => {
    setLineas((prev) => prev.filter((l) => l.clave !== clave))
  }

  const crearOrden = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!proveedorId) {
      setError('Selecciona un proveedor.')
      return
    }

    const items = lineas
      .map((l) => ({
        productoId: parseInt(l.productoId, 10),
        cantidad: parseInt(l.cantidad, 10),
        costoUnitario: parseFloat(l.costoUnitario),
      }))
      .filter((it) => !Number.isNaN(it.productoId))

    if (items.length === 0) {
      setError('Agrega al menos un ítem con un producto seleccionado.')
      return
    }

    for (const it of items) {
      if (Number.isNaN(it.cantidad) || it.cantidad <= 0) {
        setError('Cada ítem debe tener una cantidad mayor a 0.')
        return
      }
      if (Number.isNaN(it.costoUnitario) || it.costoUnitario < 0) {
        setError('Cada ítem debe tener un costo unitario mayor o igual a 0.')
        return
      }
    }

    setGuardando(true)
    try {
      const respuesta = await fetch('/api/ordenes-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedorId: parseInt(proveedorId, 10),
          notas,
          items,
        }),
      })

      if (respuesta.ok) {
        router.push('/proveedores/ordenes')
        router.refresh()
      } else {
        const errorData = await respuesta.json().catch(() => ({}))
        setError(errorData.error || 'No se pudo crear la orden de compra.')
        setGuardando(false)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al crear la orden de compra.')
      setGuardando(false)
    }
  }

  if (proveedores.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        No hay proveedores activos. Primero crea o activa un proveedor en la
        sección de Proveedores.
      </div>
    )
  }

  return (
    <form onSubmit={crearOrden} className="space-y-6">
      {error && (
        <div role="alert" className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="proveedorId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Proveedor *
            </label>
            <select
              id="proveedorId"
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un proveedor…</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="notas"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notas
            </label>
            <input
              type="text"
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Ítems</h2>
          <button
            type="button"
            onClick={agregarItem}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            + Agregar ítem
          </button>
        </div>

        <div className="space-y-3">
          {lineas.map((linea, indice) => (
            <div
              key={linea.clave}
              className="grid grid-cols-1 sm:grid-cols-[1fr_90px_120px_auto] gap-3 items-end border border-gray-200 rounded-md p-3"
            >
              <div>
                <label
                  htmlFor={`producto-${linea.clave}`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Producto
                </label>
                <select
                  id={`producto-${linea.clave}`}
                  value={linea.productoId}
                  onChange={(e) =>
                    cambiarLinea(linea.clave, 'productoId', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Selecciona…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`cantidad-${linea.clave}`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Cantidad
                </label>
                <input
                  type="number"
                  id={`cantidad-${linea.clave}`}
                  value={linea.cantidad}
                  min={1}
                  step={1}
                  onChange={(e) =>
                    cambiarLinea(linea.clave, 'cantidad', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor={`costo-${linea.clave}`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Costo unitario
                </label>
                <input
                  type="number"
                  id={`costo-${linea.clave}`}
                  value={linea.costoUnitario}
                  min={0}
                  step="0.01"
                  onChange={(e) =>
                    cambiarLinea(linea.clave, 'costoUnitario', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:pb-2">
                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                  {formatearPrecio(subtotalLinea(linea))}
                </span>
                {lineas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitarItem(linea.clave)}
                    className="text-sm text-red-600 hover:text-red-800"
                    title="Quitar ítem"
                    aria-label={`Quitar ítem ${indice + 1}`}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end items-baseline gap-3 border-t pt-4">
          <span className="text-sm font-medium text-gray-700">Total</span>
          <span className="text-2xl font-bold text-blue-700">
            {formatearPrecio(total)}
          </span>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {guardando ? 'Creando…' : 'Crear orden'}
        </button>
      </div>
    </form>
  )
}
