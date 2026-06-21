import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import TarjetaEstadistica from '@/componentes/TarjetaEstadistica'
import TarjetaEstadisticaDoble from '@/componentes/TarjetaEstadisticaDoble'
import Link from 'next/link'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { obtenerStockPorAgotarse, obtenerProductosSinMovimientos } from '@/lib/analisis'
import { MARGEN_ALERTA_STOCK } from '@/lib/inventario'
import { formatearFecha } from '@/lib/fechas'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

async function obtenerEstadisticas() {
  const [
    totalProductos,
    totalCategorias,
    movimientosRecientes,
    [metricasDB]
  ] = await Promise.all([
    prisma.producto.count(),
    prisma.categoria.count(),
    prisma.movimiento.findMany({
      take: 5,
      orderBy: { creadoEn: 'desc' },
      include: { producto: true },
    }),
    prisma.$queryRaw<{ valorInventario: number, productosSinStock: number, productosStockBajo: number }[]>`
      SELECT 
        COALESCE(SUM(precio * cantidad), 0)::float as "valorInventario",
        COALESCE(SUM(CASE WHEN cantidad <= 0 THEN 1 ELSE 0 END), 0)::int as "productosSinStock",
        COALESCE(SUM(CASE WHEN cantidad > 0 AND cantidad <= "stockMinimo" + ${MARGEN_ALERTA_STOCK} THEN 1 ELSE 0 END), 0)::int as "productosStockBajo"
      FROM "Producto"
    `
  ])

  return {
    totalProductos,
    totalCategorias,
    productosSinStock: Number(metricasDB?.productosSinStock || 0),
    productosStockBajo: Number(metricasDB?.productosStockBajo || 0),
    movimientosRecientes,
    valorInventario: Number(metricasDB?.valorInventario || 0),
  }
}

async function ContenidoDashboard() {
  const [estadisticas, sesion] = await Promise.all([
    obtenerEstadisticas(),
    obtenerSesion()
  ])
  const esAdmin = sesion?.user?.rol === 'ADMIN'

  const puedeVerAnalisis = await tienePermiso('VER_ANALISIS')
  const puedeRegistrarMovimientos = esAdmin || (await tienePermiso('REGISTRAR_MOVIMIENTOS'))
  const puedeVender = esAdmin || (await tienePermiso('REALIZAR_VENTAS'))
  const hayAccionesRapidas = esAdmin || puedeRegistrarMovimientos || puedeVender
  const [stockAgotarse, sinMovimientos] = puedeVerAnalisis
    ? await Promise.all([obtenerStockPorAgotarse(), obtenerProductosSinMovimientos()])
    : [[], []]
  const alertasTotales = stockAgotarse.length + sinMovimientos.length

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Panel Principal</h1>

        {puedeVerAnalisis && alertasTotales > 0 && (
          <div className="space-y-2">
            {stockAgotarse.length > 0 && (
              <Link
                href="/analisis#por-agotarse"
                className="block bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-4 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>⚠️</span>
                  <div className="flex-1">
                    <div className="font-semibold">
                      {stockAgotarse.length} producto{stockAgotarse.length !== 1 ? 's' : ''} en riesgo de agotarse
                    </div>
                    <div className="text-sm mt-1">
                      Stock dentro del umbral crítico o consumo proyectado &le; 7 días. Ver detalle →
                    </div>
                  </div>
                </div>
              </Link>
            )}
            {sinMovimientos.length > 0 && (
              <Link
                href="/analisis#sin-movimientos"
                className="block bg-blue-50 border border-blue-300 text-blue-900 rounded-lg p-4 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>📦</span>
                  <div className="flex-1">
                    <div className="font-semibold">
                      {sinMovimientos.length} producto{sinMovimientos.length !== 1 ? 's' : ''} sin movimientos recientes
                    </div>
                    <div className="text-sm mt-1">
                      Sin entradas ni salidas en más de 30 días. Ver detalle →
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <TarjetaEstadisticaDoble
            titulo="Inventario"
            colorFondo="bg-blue-100 text-blue-600"
            icono={
              <svg className="w-6 h-6" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            cifras={[
              { etiqueta: 'Productos', valor: estadisticas.totalProductos },
              { etiqueta: 'Categorías', valor: estadisticas.totalCategorias },
            ]}
          />
          <TarjetaEstadisticaDoble
            titulo="Alertas de stock"
            colorFondo="bg-red-100 text-red-600"
            icono={
              <svg className="w-6 h-6" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            cifras={[
              { etiqueta: 'Stock bajo', valor: estadisticas.productosStockBajo },
              { etiqueta: 'Sin stock', valor: estadisticas.productosSinStock },
            ]}
          />
          <TarjetaEstadistica
            titulo="Valor inventario"
            valor={`$${estadisticas.valorInventario.toLocaleString('es-MX')}`}
            colorFondo="bg-purple-100 text-purple-600"
            icono={
              <svg className="w-6 h-6" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Acciones rápidas */}
        {hayAccionesRapidas && (
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
              {puedeRegistrarMovimientos && (
                <Link
                  href="/movimientos/nuevo"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-center"
                >
                  + Registrar Movimiento
                </Link>
              )}
              {puedeVender && (
                <Link
                  href="/venta-rapida"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-center"
                >
                  Vender
                </Link>
              )}
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
        )}

        {/* Movimientos recientes */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Movimientos Recientes</h2>
          {estadisticas.movimientosRecientes.length > 0 ? (
            <>
              {/* Vista escritorio */}
              <div className="hidden lg:block overflow-x-auto">
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
                          {formatearFecha(movimiento.creadoEn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div className="lg:hidden divide-y divide-gray-200">
                {estadisticas.movimientosRecientes.map((m) => (
                  <div key={m.id} className="py-3 flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {m.producto.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatearFecha(m.creadoEn)}
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
  )
}

export default function PaginaPrincipal() {
  return (
    <LayoutProtegido>
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      }>
        <ContenidoDashboard />
      </Suspense>
    </LayoutProtegido>
  )
}
