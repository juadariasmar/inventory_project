import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import BotonEliminarUsuario from '@/componentes/BotonEliminarUsuario'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'

export default async function PaginaUsuarios() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'ADMIN') {
    redirect('/')
  }

  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombreUsuario: true,
      nombre: true,
      rol: true,
      creadoEn: true,
    },
    orderBy: { creadoEn: 'desc' },
  })

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <Link
            href="/usuarios/nuevo"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
          >
            + Nuevo Usuario
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Vista escritorio (tabla) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {u.nombreUsuario}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(u.creadoEn).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <Link
                        href={`/usuarios/${u.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </Link>
                      <BotonEliminarUsuario
                        id={u.id}
                        nombreUsuario={u.nombreUsuario}
                        esActual={sesion.user.id === u.id.toString()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil (cards) */}
          <div className="md:hidden divide-y divide-gray-200">
            {usuarios.map((u) => (
              <div key={u.id} className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">{u.nombre}</div>
                    <div className="text-sm text-gray-500">@{u.nombreUsuario}</div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      u.rol === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {u.rol === 'ADMIN' ? 'Administrador' : 'Usuario'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Creado: {new Date(u.creadoEn).toLocaleDateString('es-MX')}
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <Link
                    href={`/usuarios/${u.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </Link>
                  <BotonEliminarUsuario
                    id={u.id}
                    nombreUsuario={u.nombreUsuario}
                    esActual={sesion.user.id === u.id.toString()}
                  />
                </div>
              </div>
            ))}
          </div>

          {usuarios.length === 0 && (
            <div className="p-8 text-center text-gray-500">No hay usuarios.</div>
          )}
        </div>
      </div>
    </LayoutProtegido>
  )
}
