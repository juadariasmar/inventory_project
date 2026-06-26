import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import Link from 'next/link'
import { obtenerSesion } from '@/lib/permisos'
import { redirect } from 'next/navigation'
import { formatearFecha } from '@/lib/fechas'
import { formatearPrecio } from '@/lib/inventario'

export const dynamic = 'force-dynamic'

type EstadoOrden = 'BORRADOR' | 'RECIBIDA' | 'CANCELADA'

function colorEstado(estado: EstadoOrden): string {
  switch (estado) {
    case 'BORRADOR':
      return 'bg-amber-100 text-amber-800'
    case 'RECIBIDA':
      return 'bg-green-100 text-green-800'
    case 'CANCELADA':
      return 'bg-red-100 text-red-800'
  }
}

export default async function PaginaOrdenesCompra() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId
  const esAdmin = sesion.user.rol === 'ADMIN'

  const ordenes = await prisma.ordenCompra.findMany({
    where: { empresaId },
    include: {
      proveedor: { select: { nombre: true } },
      _count: { select: { items: true } },
    },
    orderBy: { creadoEn: 'desc' },
  })

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Órdenes de compra</h1>
          <div className="flex gap-2">
            <Link
              href="/proveedores"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm self-start"
            >
              ← Volver a proveedores
            </Link>
            {esAdmin && (
              <Link
                href="/proveedores/ordenes/nueva"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
              >
                + Nueva orden
              </Link>
            )}
          </div>
        </div>

        {ordenes.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Vista escritorio */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      # Orden
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ítems
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ordenes.map((orden) => (
                    <tr
                      key={orden.id}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        <Link
                          href={`/proveedores/ordenes/${orden.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          #{orden.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {orden.proveedor.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatearFecha(orden.creadoEn)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${colorEstado(
                            orden.estado
                          )}`}
                        >
                          {orden.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {orden._count.items}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">
                        {formatearPrecio(orden.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil */}
            <div className="lg:hidden divide-y divide-gray-200">
              {ordenes.map((orden) => (
                <Link
                  key={orden.id}
                  href={`/proveedores/ordenes/${orden.id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-base font-semibold text-blue-600">
                        Orden #{orden.id}
                      </p>
                      <p className="text-sm text-gray-800">
                        {orden.proveedor.nombre}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${colorEstado(
                        orden.estado
                      )}`}
                    >
                      {orden.estado}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mt-2 text-sm text-gray-600">
                    <span>{formatearFecha(orden.creadoEn)}</span>
                    <span>
                      {orden._count.items} ítem
                      {orden._count.items !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="mt-1 text-right text-base font-semibold text-gray-800">
                    {formatearPrecio(orden.total)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">
              No hay órdenes de compra registradas.
              {esAdmin && (
                <>
                  {' '}
                  <Link
                    href="/proveedores/ordenes/nueva"
                    className="text-blue-600 hover:underline"
                  >
                    Crear una nueva
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
