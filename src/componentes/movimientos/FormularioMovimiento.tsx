'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const contenedorRef = useRef<HTMLDivElement>(null)

  const productoSeleccionado = productos.find(
    (p) => p.id === parseInt(datos.productoId)
  )

  const opciones = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q || productoSeleccionado) return productos
    return productos.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q)
    )
  }, [busqueda, productos, productoSeleccionado])

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

  const seleccionarProducto = (p: Producto) => {
    setDatos((prev) => ({ ...prev, productoId: String(p.id) }))
    setBusqueda(`${p.codigo} - ${p.nombre}`)
    setAbierto(false)
  }

  const manejarTeclaBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Enter' &&
      !productoSeleccionado &&
      busqueda.trim() &&
      opciones.length > 0
    ) {
      e.preventDefault()
      seleccionarProducto(opciones[0])
    } else if (e.key === 'Escape') {
      setAbierto(false)
    } else if (e.key === 'ArrowDown' && !abierto) {
      setAbierto(true)
    }
  }

  const manejarCambio = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setDatos((prev) => ({ ...prev, [name]: value }))
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!datos.productoId) {
      setError('Selecciona un producto del listado')
      return
    }
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
            Producto *
          </label>
          <div className="relative" ref={contenedorRef}>
            <input
              type="text"
              id="busquedaProducto"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setDatos((prev) => ({ ...prev, productoId: '' }))
                setAbierto(true)
              }}
              onFocus={() => setAbierto(true)}
              onKeyDown={manejarTeclaBusqueda}
              placeholder="Escribe para buscar o haz clic en ▾ para ver todos"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={!datos.productoId}
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
                    !productoSeleccionado && busqueda.trim() && i === 0
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => seleccionarProducto(p)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
                        esPrimeraCoincidencia ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{p.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {p.codigo} · Stock: {p.cantidad}
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
          <input type="hidden" name="productoId" value={datos.productoId} />
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
