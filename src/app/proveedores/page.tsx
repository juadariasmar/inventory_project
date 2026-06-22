import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import Link from 'next/link'
import BotonEliminarProveedor from '@/componentes/BotonEliminarProveedor'
import { obtenerSesion } from '@/lib/permisos'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PaginaProveedores() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId
  const esAdmin = sesion.user.rol === 'ADMIN'

  const proveedores = await prisma.proveedor.findMany({
    where: { empresaId },
    orderBy: { nombre: 'asc' },
  })

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Proveedores</h1>
          {esAdmin && (
            <Link
              href="/proveedores/nuevo"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
            >
              + Nuevo proveedor
            </Link>
          )}
        </div>

        {proveedores.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Vista escritorio */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    {esAdmin && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {proveedores.map((proveedor) => (
                    <tr key={proveedor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {proveedor.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {proveedor.contacto || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {proveedor.telefono || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {proveedor.email || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            proveedor.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {proveedor.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {esAdmin && (
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex justify-end items-center gap-4">
                            <Link
                              href={`/proveedores/${proveedor.id}`}
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              Editar
                            </Link>
                            <BotonEliminarProveedor
                              id={proveedor.id}
                              nombre={proveedor.nombre}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil */}
            <div className="lg:hidden divide-y divide-gray-200">
              {proveedores.map((proveedor) => (
                <div key={proveedor.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-base font-semibold text-gray-800">
                      {proveedor.nombre}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        proveedor.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {proveedor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {proveedor.contacto && (
                    <p className="text-sm text-gray-600">
                      Contacto: {proveedor.contacto}
                    </p>
                  )}
                  {proveedor.telefono && (
                    <p className="text-sm text-gray-600">
                      Teléfono: {proveedor.telefono}
                    </p>
                  )}
                  {proveedor.email && (
                    <p className="text-sm text-gray-600 break-all">
                      Correo: {proveedor.email}
                    </p>
                  )}
                  {esAdmin && (
                    <div className="flex items-center gap-4 pt-2">
                      <Link
                        href={`/proveedores/${proveedor.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </Link>
                      <BotonEliminarProveedor
                        id={proveedor.id}
                        nombre={proveedor.nombre}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">
              No hay proveedores registrados.
              {esAdmin && (
                <>
                  {' '}
                  <Link
                    href="/proveedores/nuevo"
                    className="text-blue-600 hover:underline"
                  >
                    Crear uno nuevo
                  </Link>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </LayoutProtegido>
  )
}
