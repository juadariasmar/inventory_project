'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

interface Producto {
  id: number
  nombre: string
  codigo: string
  cantidad: number
}

interface PropiedadesFormulario {
  productos: Producto[]
}

export default function FormularioMovimiento({ productos }: PropiedadesFormulario) {
  const router = useRouter()

  const [datos, setDatos] = useState({
    productoId: '',
    tipo: 'entrada',
    cantidad: '',
    notas: '',
  })
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const productoSeleccionado = productos.find(
    (p) => p.id === parseInt(datos.productoId)
  )

  const resultadosBusqueda = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return []
    return productos
      .filter(
        (p) =>
          p.codigo.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [busqueda, productos])

  const seleccionarProducto = (p: Producto) => {
    setDatos((prev) => ({ ...prev, productoId: String(p.id) }))
    setBusqueda(`${p.codigo} - ${p.nombre}`)
  }

  const manejarTeclaBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && resultadosBusqueda.length > 0) {
      e.preventDefault()
      seleccionarProducto(resultadosBusqueda[0])
    }
  }

  const manejarCambio = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setDatos((prev) => ({ ...prev, [name]: value }))
    if (name === 'productoId') {
      const p = productos.find((p) => p.id === parseInt(value))
      setBusqueda(p ? `${p.codigo} - ${p.nombre}` : '')
    }
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      const respuesta = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })

      if (respuesta.ok) {
        router.push('/movimientos')
        router.refresh()
      } else {
        const errorData = await respuesta.json()
        setError(errorData.error || 'Error al registrar el movimiento')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al registrar el movimiento')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label
            htmlFor="busquedaProducto"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Buscar producto (código o nombre)
          </label>
          <div className="relative">
            <input
              type="text"
              id="busquedaProducto"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setDatos((prev) => ({ ...prev, productoId: '' }))
              }}
              onKeyDown={manejarTeclaBusqueda}
              placeholder="Escribe para buscar… (Enter selecciona la primera coincidencia)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {resultadosBusqueda.length > 0 && !productoSeleccionado && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
                {resultadosBusqueda.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => seleccionarProducto(p)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
                      i === 0 ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{p.nombre}</div>
                    <div className="text-xs text-gray-500">
                      {p.codigo} · Stock: {p.cantidad}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <label
            htmlFor="productoId"
            className="block text-sm font-medium text-gray-700 mt-3 mb-1"
          >
            Producto *
          </label>
          <select
            id="productoId"
            name="productoId"
            value={datos.productoId}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecciona un producto</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.codigo} - {producto.nombre} (Stock: {producto.cantidad})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="tipo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tipo de Movimiento *
          </label>
          <select
            id="tipo"
            name="tipo"
            value={datos.tipo}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="entrada">Entrada (Agregar stock)</option>
            <option value="salida">Salida (Quitar stock)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="cantidad"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Cantidad *
          </label>
          <input
            type="number"
            id="cantidad"
            name="cantidad"
            value={datos.cantidad}
            onChange={manejarCambio}
            min="1"
            max={
              datos.tipo === 'salida' && productoSeleccionado
                ? productoSeleccionado.cantidad
                : undefined
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {datos.tipo === 'salida' && productoSeleccionado && (
            <p className="text-sm text-gray-500 mt-1">
              Stock disponible: {productoSeleccionado.cantidad}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="notas"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notas
          </label>
          <textarea
            id="notas"
            name="notas"
            value={datos.notas}
            onChange={manejarCambio}
            rows={3}
            placeholder="Ej: Compra a proveedor, Venta a cliente, Ajuste de inventario..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          className={`px-4 py-2 text-white rounded-md disabled:opacity-50 transition-colors ${
            datos.tipo === 'entrada'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {guardando
            ? 'Guardando...'
            : datos.tipo === 'entrada'
            ? 'Registrar Entrada'
            : 'Registrar Salida'}
        </button>
      </div>
    </form>
  )
}
