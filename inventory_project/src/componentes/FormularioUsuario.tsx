'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DatosUsuario {
  id?: number
  nombreUsuario: string
  nombre: string
  rol: 'ADMIN' | 'USUARIO'
}

interface PropiedadesFormulario {
  usuario?: DatosUsuario
}

export default function FormularioUsuario({ usuario }: PropiedadesFormulario) {
  const router = useRouter()
  const esEdicion = !!usuario?.id

  const [datos, setDatos] = useState({
    nombreUsuario: usuario?.nombreUsuario || '',
    nombre: usuario?.nombre || '',
    rol: usuario?.rol || 'USUARIO',
    contrasena: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const manejarCambio = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setDatos((prev) => ({ ...prev, [name]: value }))
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!esEdicion && datos.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (esEdicion && datos.contrasena && datos.contrasena.length < 6) {
      setError('Si vas a cambiar la contraseña, debe tener al menos 6 caracteres')
      return
    }

    setGuardando(true)

    try {
      const url = esEdicion ? `/api/usuarios/${usuario.id}` : '/api/usuarios'
      const metodo = esEdicion ? 'PUT' : 'POST'

      const body: Record<string, string> = {
        nombreUsuario: datos.nombreUsuario,
        nombre: datos.nombre,
        rol: datos.rol,
      }
      if (datos.contrasena) {
        body.contrasena = datos.contrasena
      }

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (respuesta.ok) {
        router.push('/usuarios')
        router.refresh()
      } else {
        const errorData = await respuesta.json()
        setError(errorData.error || 'Error al guardar el usuario')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al guardar el usuario')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo *
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

        <div>
          <label
            htmlFor="nombreUsuario"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre de usuario *
          </label>
          <input
            type="text"
            id="nombreUsuario"
            name="nombreUsuario"
            value={datos.nombreUsuario}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
            Rol *
          </label>
          <select
            id="rol"
            name="rol"
            value={datos.rol}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USUARIO">Usuario (solo movimientos)</option>
            <option value="ADMIN">Administrador (acceso total)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="contrasena"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Contraseña {esEdicion ? '(dejar en blanco para no cambiar)' : '*'}
          </label>
          <input
            type="password"
            id="contrasena"
            name="contrasena"
            value={datos.contrasena}
            onChange={manejarCambio}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password"
            minLength={esEdicion ? 0 : 6}
            required={!esEdicion}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
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
          {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  )
}
