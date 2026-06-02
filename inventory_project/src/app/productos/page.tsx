import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import Link from 'next/link'
import BotonEliminarProducto from '@/componentes/BotonEliminarProducto'
import BotonVenderProducto from '@/componentes/BotonVenderProducto'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { estadoStock, etiquetaEstadoStock } from '@/lib/inventario'

const CLASES_ESTADO = {
  sin_stock: 'bg-gray-200 text-gray-800',
  stock_bajo: 'bg-red-100 text-red-800',
  normal: 'bg-green-100 text-green-800',
} as const

export const dynamic = 'force-dynamic'

async function obtenerProductos() {
  return await prisma.producto.findMany({
    include: { categoria: true },
    orderBy: { creadoEn: 'desc' },
  })
}

export default async function PaginaProductos() {
  const productos = await obtenerProductos()
  const sesion = await obtenerSesion()
  const esAdmin = sesion?.user?.rol === 'ADMIN'
  const puedeVender =
    (await tienePermiso('REALIZAR_VENTAS')) ||
    (await tienePermiso('REGISTRAR_MOVIMIENTOS'))

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          {esAdmin && (
            <Link
              href="/productos/nuevo"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
            >
              + Nuevo Producto
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {productos.length > 0 ? (
            <>
              {/* Vista escritorio (tabla) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productos.map((producto) => (
                      <tr key={producto.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {producto.codigo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {producto.categoria?.nombre || 'Sin categoría'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${producto.precio.toLocaleString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.cantidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const e = estadoStock(producto)
                            return (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${CLASES_ESTADO[e]}`}
                              >
                                {etiquetaEstadoStock(e)}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                          {puedeVender && (
                            <BotonVenderProducto
                              id={producto.id}
                              nombre={producto.nombre}
                              stockActual={producto.cantidad}
                              precio={producto.precio}
                            />
                          )}
                          {esAdmin && (
                            <>
                              <Link
                                href={`/productos/${producto.id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Editar
                              </Link>
                              <BotonEliminarProducto
                                id={producto.id}
                                nombre={producto.nombre}
                              />
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil (cards) */}
              <div className="md:hidden divide-y divide-gray-200">
                {productos.map((producto) => (
                  <div key={producto.id} className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {producto.nombre}
                        </div>
                        <div className="text-xs text-gray-500">
                          {producto.codigo}
                          {producto.categoria?.nombre && (
                            <> · {producto.categoria.nombre}</>
                          )}
                        </div>
                      </div>
                      {(() => {
                        const e = estadoStock(producto)
                        return (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${CLASES_ESTADO[e]}`}
                          >
                            {etiquetaEstadoStock(e)}
                          </span>
                        )
                      })()}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Precio</div>
                        <div className="font-medium">
                          ${producto.precio.toLocaleString('es-MX')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Cantidad</div>
                        <div className="font-medium">{producto.cantidad}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-4 text-sm">
                      <BotonVenderProducto
                        id={producto.id}
                        nombre={producto.nombre}
                        stockActual={producto.cantidad}
                        precio={producto.precio}
                      />
                      {esAdmin && (
                        <>
                          <Link
                            href={`/productos/${producto.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </Link>
                          <BotonEliminarProducto
                            id={producto.id}
                            nombre={producto.nombre}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No hay productos registrados.
              {esAdmin && (
                <>
                  {' '}
                  <Link href="/productos/nuevo" className="text-blue-600 hover:underline">
                    Agregar uno nuevo
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
