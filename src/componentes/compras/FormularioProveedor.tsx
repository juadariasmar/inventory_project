'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DatosProveedor {
  id?: number
  nombre: string
  nit: string | null
  contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
}

interface PropiedadesFormulario {
  proveedor?: DatosProveedor
}

export default function FormularioProveedor({ proveedor }: PropiedadesFormulario) {
  const router = useRouter()
  const esEdicion = !!proveedor?.id

  const [datos, setDatos] = useState({
    nombre: proveedor?.nombre || '',
    nit: proveedor?.nit || '',
    contacto: proveedor?.contacto || '',
    telefono: proveedor?.telefono || '',
    email: proveedor?.email || '',
    direccion: proveedor?.direccion || '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const manejarCambio = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setDatos((prev) => ({ ...prev, [name]: value }))
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      const url = esEdicion
        ? `/api/proveedores/${proveedor.id}`
        : '/api/proveedores'
      const metodo = esEdicion ? 'PUT' : 'POST'

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })

      if (respuesta.ok) {
        router.push('/proveedores')
        router.refresh()
      } else {
        const errorData = await respuesta.json().catch(() => ({}))
        setError(errorData.error || 'Error al guardar el proveedor')
        setGuardando(false)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al guardar el proveedor')
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-6">
      {error && (
        <div role="alert" className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
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
            placeholder="Ej: Distribuidora Andina S.A.S."
            required
          />
        </div>

        <div>
          <label
            htmlFor="nit"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            NIT
          </label>
          <input
            type="text"
            id="nit"
            name="nit"
            value={datos.nit}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="contacto"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Contacto
          </label>
          <input
            type="text"
            id="contacto"
            name="contacto"
            value={datos.contacto}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre de la persona de contacto"
          />
        </div>

        <div>
          <label
            htmlFor="telefono"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Teléfono
          </label>
          <input
            type="text"
            id="telefono"
            name="telefono"
            value={datos.telefono}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Correo electrónico
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={datos.email}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="direccion"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Dirección
          </label>
          <textarea
            id="direccion"
            name="direccion"
            value={datos.direccion}
            onChange={manejarCambio}
            rows={2}
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
          {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear proveedor'}
        </button>
      </div>
    </form>
  )
}
