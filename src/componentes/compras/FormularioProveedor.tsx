'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/componentes/comunes/Input'
import { Button } from '@/componentes/comunes/Button'
import { AlertCircle } from 'lucide-react'

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
    <form onSubmit={manejarEnvio} className="space-y-6" noValidate>
      {error && (
        <div role="alert" className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Nombre"
            id="nombre"
            name="nombre"
            value={datos.nombre}
            onChange={manejarCambio}
            placeholder="Ej: Distribuidora Andina S.A.S."
            required
          />
        </div>

        <Input
          label="NIT"
          id="nit"
          name="nit"
          value={datos.nit}
          onChange={manejarCambio}
        />

        <Input
          label="Contacto"
          id="contacto"
          name="contacto"
          value={datos.contacto}
          onChange={manejarCambio}
          placeholder="Nombre de la persona de contacto"
        />

        <Input
          label="Teléfono"
          type="tel"
          id="telefono"
          name="telefono"
          value={datos.telefono}
          onChange={manejarCambio}
        />

        <Input
          label="Correo electrónico"
          type="email"
          id="email"
          name="email"
          value={datos.email}
          onChange={manejarCambio}
        />

        <div className="md:col-span-2">
          <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1.5">
            Dirección
          </label>
          <textarea
            id="direccion"
            name="direccion"
            value={datos.direccion}
            onChange={manejarCambio}
            rows={2}
            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg transition-premium placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={guardando} loadingText="Guardando...">
          {esEdicion ? 'Actualizar' : 'Crear proveedor'}
        </Button>
      </div>
    </form>
  )
}
