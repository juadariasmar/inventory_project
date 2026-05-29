import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import Link from 'next/link'
import { tienePermiso } from '@/lib/permisos'

async function obtenerMovimientos() {
  return await prisma.movimiento.findMany({
    include: { producto: true },
    orderBy: { creadoEn: 'desc' },
  })
}

export default async function PaginaMovimientos() {
  const movimientos = await obtenerMovimientos()
  const puedeAgregar = await tienePermiso('AGREGAR_STOCK')
  const puedeDescontar = await tienePermiso('DESCONTAR_STOCK')
  const puedeRegistrar = puedeAgregar || puedeDescontar

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Movimientos de Inventario</h1>
          {puedeRegistrar && (
            <Link
              href="/movimientos/nuevo"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-center"
            >
              + Registrar Movimiento
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {movimientos.length > 0 ? (
            <>
              {/* Vista escritorio (tabla) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movimientos.map((movimiento) => (
                      <tr key={movimiento.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(movimiento.creadoEn).toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{movimiento.producto.nombre}</div>
                            <div className="text-gray-500 text-xs">
                              {movimiento.producto.codigo}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              movimiento.tipo === 'entrada'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`font-medium ${
                              movimiento.tipo === 'entrada'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {movimiento.tipo === 'entrada' ? '+' : '-'}
                            {movimiento.cantidad}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {movimiento.notas || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil (cards) */}
              <div className="md:hidden divide-y divide-gray-200">
                {movimientos.map((m) => (
                  <div key={m.id} className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {m.producto.nombre}
                        </div>
                        <div className="text-xs text-gray-500">{m.producto.codigo}</div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          m.tipo === 'entrada'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between items-baseline">
                      <span
                        className={`text-lg font-bold ${
                          m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {m.tipo === 'entrada' ? '+' : '-'}
                        {m.cantidad}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(m.creadoEn).toLocaleString('es-MX', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    {m.notas && (
                      <div className="mt-2 text-xs text-gray-600">{m.notas}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No hay movimientos registrados.
              {puedeRegistrar && (
                <>
                  {' '}
                  <Link href="/movimientos/nuevo" className="text-blue-600 hover:underline">
                    Registrar uno nuevo
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </LayoutProtegido>
  )
}
