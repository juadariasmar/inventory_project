import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

export default async function PaginaAdmin() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'SUPER_ADMIN') {
    redirect('/')
  }

  const empresas = await prisma.empresa.findMany({
    orderBy: { creadoEn: 'desc' },
    include: {
      _count: {
        select: {
          usuarios: true,
          productos: true,
          ventas: true,
        },
      },
    },
  })

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Panel</Link>
          <span>/</span>
          <span className="text-gray-800">Administración</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">Administración</h1>
          <p className="text-sm text-gray-500 mt-1">
            Panel de administración global del sistema.
          </p>
        </div>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Empresas ({empresas.length})
          </h2>

          {empresas.length === 0 ? (
            <p className="text-sm text-gray-500">No hay empresas registradas.</p>
          ) : (
            <>
              {/* Vista escritorio */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Nombre</th>
                      <th className="pb-3 pr-4 font-medium">Creada</th>
                      <th className="pb-3 pr-4 font-medium text-center">Usuarios</th>
                      <th className="pb-3 pr-4 font-medium text-center">Productos</th>
                      <th className="pb-3 font-medium text-center">Ventas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresas.map((empresa) => (
                      <tr key={empresa.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <Link
                            href={`/admin/empresas/${empresa.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {empresa.nombre}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-gray-500">
                          {new Date(empresa.creadoEn).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 pr-4 text-center">{empresa._count.usuarios}</td>
                        <td className="py-3 pr-4 text-center">{empresa._count.productos}</td>
                        <td className="py-3 text-center">{empresa._count.ventas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div className="md:hidden divide-y divide-gray-200">
                {empresas.map((empresa) => (
                  <Link
                    key={empresa.id}
                    href={`/admin/empresas/${empresa.id}`}
                    className="block p-3 hover:bg-gray-50"
                  >
                    <p className="font-semibold text-blue-600 text-sm">{empresa.nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(empresa.creadoEn).toLocaleDateString('es-CO', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-600">
                      <span>{empresa._count.usuarios} usuarios</span>
                      <span>{empresa._count.productos} productos</span>
                      <span>{empresa._count.ventas} ventas</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </LayoutProtegido>
  )
}
