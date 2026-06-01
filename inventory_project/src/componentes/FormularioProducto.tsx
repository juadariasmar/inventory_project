'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Categoria {
  id: number
  nombre: string
}

interface DatosProducto {
  id?: number
  nombre: string
  descripcion: string
  codigo: string
  precio: number
  cantidad: number
  stockMinimo: number
  categoriaId: number | null
}

interface PropiedadesFormulario {
  producto?: DatosProducto
  categorias: Categoria[]
}

export default function FormularioProducto({
  producto,
  categorias,
}: PropiedadesFormulario) {
  const router = useRouter()
  const esEdicion = !!producto?.id

  const [datos, setDatos] = useState({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    codigo: producto?.codigo || '',
    precio: producto?.precio?.toString() || '',
    cantidad: producto?.cantidad?.toString() || '0',
    stockMinimo: producto?.stockMinimo?.toString() || '5',
    categoriaId: producto?.categoriaId?.toString() || '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const manejarCambio = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setDatos((prev) => ({ ...prev, [name]: value }))
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      const url = esEdicion ? `/api/productos/${producto.id}` : '/api/productos'
      const metodo = esEdicion ? 'PUT' : 'POST'

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })

      if (respuesta.ok) {
        router.push('/productos')
        router.refresh()
      } else {
        const errorData = await respuesta.json()
        setError(errorData.error || 'Error al guardar el producto')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al guardar el producto')
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
        <div>
          <label
            htmlFor="codigo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Código *
          </label>
          <input
            type="text"
            id="codigo"
            name="codigo"
            value={datos.codigo}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="nombre"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre *
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={datos.nombre}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="descripcion"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={datos.descripcion}
            onChange={manejarCambio}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="categoriaId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Categoría
          </label>
          <select
            id="categoriaId"
            name="categoriaId"
            value={datos.categoriaId}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="precio"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Precio *
          </label>
          <input
            type="number"
            id="precio"
            name="precio"
            value={datos.precio}
            onChange={manejarCambio}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="cantidad"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {esEdicion ? 'Cantidad actual' : 'Cantidad inicial'}
          </label>
          <input
            type="number"
            id="cantidad"
            name="cantidad"
            value={datos.cantidad}
            onChange={manejarCambio}
            min={esEdicion ? producto?.cantidad ?? 0 : 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {esEdicion ? (
            <p className="text-xs text-gray-500 mt-1">
              Aumentar genera un movimiento de entrada automático. Para reducir
              el stock, registra un movimiento de salida desde Movimientos.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Si es mayor a 0, se registrará un movimiento de entrada como
              &quot;Stock inicial&quot;.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="stockMinimo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Stock Mínimo
          </label>
          <input
            type="number"
            id="stockMinimo"
            name="stockMinimo"
            value={datos.stockMinimo}
            onChange={manejarCambio}
            min="0"
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
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear Producto'}
        </button>
      </div>
    </form>
  )
}
