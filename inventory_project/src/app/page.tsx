import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import TarjetaEstadistica from '@/componentes/TarjetaEstadistica'
import Link from 'next/link'
import { obtenerSesion } from '@/lib/permisos'

async function obtenerEstadisticas() {
  const [
    totalProductos,
    totalCategorias,
    productos,
    movimientosRecientes,
  ] = await Promise.all([
    prisma.producto.count(),
    prisma.categoria.count(),
    prisma.producto.findMany({
      select: { cantidad: true, stockMinimo: true, precio: true },
    }),
    prisma.movimiento.findMany({
      take: 5,
      orderBy: { creadoEn: 'desc' },
      include: { producto: true },
    }),
  ])

  // Contar productos con stock bajo
  const productosStockBajo = productos.filter(
    (p) => p.cantidad <= p.stockMinimo
  ).length

  // Calcular valor total del inventario
  const valorInventario = productos.reduce(
    (total, p) => total + p.precio * p.cantidad,
    0
  )

  return {
    totalProductos,
    totalCategorias,
    productosStockBajo,
    movimientosRecientes,
    valorInventario,
  }
}

export default async function PaginaPrincipal() {
  const estadisticas = await obtenerEstadisticas()
  const sesion = await obtenerSesion()
  const esAdmin = sesion?.user?.rol === 'ADMIN'

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Panel Principal</h1>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <TarjetaEstadistica
            titulo="Total Productos"
            valor={estadisticas.totalProductos}
            colorFondo="bg-blue-100 text-blue-600"
            icono={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <TarjetaEstadistica
            titulo="Categorías"
            valor={estadisticas.totalCategorias}
            colorFondo="bg-green-100 text-green-600"
            icono={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          />
          <TarjetaEstadistica
            titulo="Stock Bajo"
            valor={estadisticas.productosStockBajo}
            colorFondo="bg-red-100 text-red-600"
            icono={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <TarjetaEstadistica
            titulo="Valor Inventario"
            valor={`$${estadisticas.valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            colorFondo="bg-purple-100 text-purple-600"
            icono={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {esAdmin && (
              <Link
                href="/productos/nuevo"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
              >
                + Nuevo Producto
              </Link>
            )}
            <Link
              href="/movimientos/nuevo"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-center"
            >
              + Registrar Movimiento
            </Link>
            {esAdmin && (
              <Link
                href="/categorias/nueva"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-center"
              >
                + Nueva Categoría
              </Link>
            )}
          </div>
        </div>

        {/* Movimientos recientes */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Movimientos Recientes</h2>
          {estadisticas.movimientosRecientes.length > 0 ? (
            <>
              {/* Vista escritorio */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {estadisticas.movimientosRecientes.map((movimiento) => (
                      <tr key={movimiento.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.producto.nombre}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.cantidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(movimiento.creadoEn).toLocaleDateString('es-MX')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div className="md:hidden divide-y divide-gray-200">
                {estadisticas.movimientosRecientes.map((m) => (
                  <div key={m.id} className="py-3 flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {m.producto.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(m.creadoEn).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        m.tipo === 'entrada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {m.tipo === 'entrada' ? '+' : '-'}
                      {m.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay movimientos registrados</p>
          )}
        </div>
      </div>
    </LayoutProtegido>
  )
}
