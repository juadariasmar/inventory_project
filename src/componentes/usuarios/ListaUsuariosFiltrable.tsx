'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import BotonEliminarUsuario from '@/componentes/usuarios/BotonEliminarUsuario'
import BotonCambiarEstadoUsuario from '@/componentes/usuarios/BotonCambiarEstadoUsuario'
import { formatearFecha } from '@/lib/fechas'

interface UsuarioFilaProps {
  id: string
  email: string
  nombre: string
  rol: 'ADMIN' | 'USUARIO'
  estado: 'PENDIENTE' | 'ACTIVO' | 'SUSPENDIDO'
  creadoEn: string | Date
}

interface Propiedades {
  usuarios: UsuarioFilaProps[]
  usuarioActualId: string
}

type RolFiltro = 'todos' | 'ADMIN' | 'USUARIO'
type CampoOrden = 'nombre' | 'usuario' | 'rol' | 'estado' | 'creado'
type Dir = 'asc' | 'desc'

export default function ListaUsuariosFiltrable({
  usuarios,
  usuarioActualId,
}: Propiedades) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [rol, setRol] = useState<RolFiltro>(
    (searchParams.get('rol') as RolFiltro) ?? 'todos'
  )
  const [campoOrden, setCampoOrden] = useState<CampoOrden>(
    (searchParams.get('orden')?.split('-')[0] as CampoOrden) ?? 'nombre'
  )
  const [dir, setDir] = useState<Dir>(
    (searchParams.get('orden')?.split('-')[1] as Dir) ?? 'asc'
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (rol !== 'todos') params.set('rol', rol)
    if (campoOrden !== 'nombre' || dir !== 'asc') params.set('orden', `${campoOrden}-${dir}`)
    const qs = params.toString()
    router.replace(qs ? `/usuarios?${qs}` : '/usuarios', { scroll: false })
  }, [q, rol, campoOrden, dir, router])

  const filtrados = useMemo(() => {
    const busq = q.trim().toLowerCase()
    let lista = usuarios.filter((u) => {
      if (busq) {
        const enNombre = u.nombre.toLowerCase().includes(busq)
        const enUsuario = u.email.toLowerCase().includes(busq)
        if (!enNombre && !enUsuario) return false
      }
      if (rol !== 'todos' && u.rol !== rol) return false
      return true
    })
    const factor = dir === 'asc' ? 1 : -1
    lista = [...lista].sort((a, b) => {
      let av: string | number, bv: string | number
      switch (campoOrden) {
        case 'usuario':
          av = a.email.toLowerCase()
          bv = b.email.toLowerCase()
          break
        case 'rol':
          av = a.rol; bv = b.rol; break
        case 'estado':
          av = a.estado; bv = b.estado; break
        case 'creado':
          av = new Date(a.creadoEn).getTime()
          bv = new Date(b.creadoEn).getTime()
          break
        default:
          av = a.nombre.toLowerCase()
          bv = b.nombre.toLowerCase()
      }
      if (av < bv) return -1 * factor
      if (av > bv) return 1 * factor
      return 0
    })
    return lista
  }, [usuarios, q, rol, campoOrden, dir])

  const hayFiltros = q.trim() !== '' || rol !== 'todos'

  const limpiar = () => { setQ(''); setRol('todos') }

  const ordenarPor = (campo: CampoOrden) => {
    if (campoOrden === campo) {
      setDir(dir === 'asc' ? 'desc' : 'asc')
    } else {
      setCampoOrden(campo)
      setDir(campo === 'creado' ? 'desc' : 'asc')
    }
  }

  const flecha = (campo: CampoOrden) =>
    campoOrden === campo ? (dir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre o nombre de usuario…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Rol
            </label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolFiltro)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="ADMIN">Administrador</option>
              <option value="USUARIO">Usuario</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
          <span className="text-gray-600">
            Mostrando <strong>{filtrados.length}</strong> de{' '}
            <strong>{usuarios.length}</strong> usuarios
          </span>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiar}
              className="text-blue-600 hover:text-blue-800 underline self-start sm:self-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filtrados.length > 0 ? (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => ordenarPor('usuario')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Usuario{flecha('usuario')}
                    </th>
                    <th
                      onClick={() => ordenarPor('nombre')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Nombre{flecha('nombre')}
                    </th>
                    <th
                      onClick={() => ordenarPor('rol')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Rol{flecha('rol')}
                    </th>
                    <th
                      onClick={() => ordenarPor('estado')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Estado{flecha('estado')}
                    </th>
                    <th
                      onClick={() => ordenarPor('creado')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                    >
                      Creado{flecha('creado')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtrados.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {u.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            u.rol === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {u.rol === 'ADMIN' ? 'Administrador' : 'Usuario'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            u.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' :
                            u.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(u.creadoEn)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                        <Link
                          href={`/usuarios/${u.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </Link>
                        <BotonCambiarEstadoUsuario
                          id={u.id}
                          estado={u.estado}
                          esActual={usuarioActualId === u.id.toString()}
                        />
                        <BotonEliminarUsuario
                          id={u.id}
                          email={u.email}
                          esActual={usuarioActualId === u.id.toString()}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-gray-200">
              {filtrados.map((u) => (
                <div key={u.id} className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-semibold text-gray-900">{u.nombre}</div>
                      <div className="text-sm text-gray-500">@{u.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          u.rol === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {u.rol === 'ADMIN' ? 'Administrador' : 'Usuario'}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          u.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' :
                          u.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.estado}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Creado: {formatearFecha(u.creadoEn)}
                  </div>
                  <div className="mt-3 flex gap-4 text-sm">
                    <Link
                      href={`/usuarios/${u.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </Link>
                    <BotonCambiarEstadoUsuario
                      id={u.id}
                      estado={u.estado}
                      esActual={usuarioActualId === u.id.toString()}
                    />
                    <BotonEliminarUsuario
                      id={u.id}
                      email={u.email}
                      esActual={usuarioActualId === u.id.toString()}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {hayFiltros ? (
              <>
                No hay usuarios que coincidan con los filtros.{' '}
                <button
                  type="button"
                  onClick={limpiar}
                  className="text-blue-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>No hay usuarios.</>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
