import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { estadoStock, etiquetaEstadoStock, type EstadoStock } from '@/lib/inventario'
import { formatearFechaHora } from '@/lib/fechas'

export const dynamic = 'force-dynamic'

const DIAS_VENTANA = 30

const CLASES_ESTADO: Record<EstadoStock, string> = {
  sin_stock: 'bg-gray-200 text-gray-800',
  stock_bajo: 'bg-red-100 text-red-800',
  normal: 'bg-green-100 text-green-800',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaginaDetalleProducto({ params }: Props) {
  const { id } = await params
  const productoId = parseInt(id, 10)
  if (!productoId || Number.isNaN(productoId)) notFound()

  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/login')
  const empresaId = sesion.user.empresaId
  const esAdmin = sesion.user.rol === 'ADMIN'

  const desde = new Date()
  desde.setDate(desde.getDate() - DIAS_VENTANA)

  const [producto, movimientos, salidasVentana, entradasVentana] = await Promise.all([
    prisma.producto.findUnique({
      where: { id: productoId, empresaId },
      include: { categoria: true },
    }),
    prisma.movimiento.findMany({
      where: { productoId, empresaId },
      include: { venta: { select: { id: true, total: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 100,
    }),
    prisma.movimiento.aggregate({
      where: { productoId, empresaId, tipo: 'salida', creadoEn: { gte: desde } },
      _sum: { cantidad: true },
      _count: { _all: true },
    }),
    prisma.movimiento.aggregate({
      where: { productoId, empresaId, tipo: 'entrada', creadoEn: { gte: desde } },
      _sum: { cantidad: true },
      _count: { _all: true },
    }),
  ])

  if (!producto) notFound()

  const puedeExportar = await tienePermiso('EXPORTAR_REPORTES')
  const totalSalidas = salidasVentana._sum.cantidad ?? 0
  const totalEntradas = entradasVentana._sum.cantidad ?? 0
  const consumoDiario = totalSalidas / DIAS_VENTANA
  const diasParaAgotarse =
    consumoDiario > 0 ? Math.round((producto.cantidad / consumoDiario) * 10) / 10 : null
  const ingresosUltimos30 = totalSalidas * producto.precio
  const valorEnStock = producto.precio * producto.cantidad

  const e = estadoStock(producto)

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/productos" className="hover:text-blue-600">Productos</Link>
          <span>/</span>
          <span className="text-gray-800">{producto.nombre}</span>
        </div>

        {/* Header con info y acciones */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-800 break-words">
                {producto.nombre}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Código: <span className="font-mono">{producto.codigo}</span>
                {producto.categoria && (
                  <> · Categoría: {producto.categoria.nombre}</>
                )}
              </p>
              {producto.descripcion && (
                <p className="text-sm text-gray-600 mt-2">{producto.descripcion}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 text-xs font-medium rounded-full self-start ${CLASES_ESTADO[e]}`}>
                {etiquetaEstadoStock(e)}
              </span>
              {esAdmin && (
                <Link
                  href={`/productos/${producto.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Editar
                </Link>
              )}
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
            <Metrica titulo="Stock actual" valor={producto.cantidad.toString()} />
            <Metrica titulo="Stock mínimo" valor={producto.stockMinimo.toString()} />
            <Metrica titulo="Precio unitario" valor={`$${producto.precio.toLocaleString('es-MX')}`} />
            <Metrica titulo="Valor en stock" valor={`$${valorEnStock.toLocaleString('es-MX')}`} />
          </div>
        </div>

        {/* Estadísticas últimos 30 días */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Comportamiento últimos {DIAS_VENTANA} días
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Basado en movimientos registrados desde {formatearFechaHora(desde).split(',')[0]}.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metrica
              titulo="Unidades vendidas"
              valor={totalSalidas.toString()}
              detalle={`${salidasVentana._count._all} movimientos`}
              color="text-red-700"
            />
            <Metrica
              titulo="Unidades ingresadas"
              valor={totalEntradas.toString()}
              detalle={`${entradasVentana._count._all} movimientos`}
              color="text-green-700"
            />
            <Metrica
              titulo="Ingresos por ventas"
              valor={`$${ingresosUltimos30.toLocaleString('es-MX')}`}
            />
            <Metrica
              titulo="Días estimados de stock"
              valor={diasParaAgotarse === null ? 'Sin consumo' : `${diasParaAgotarse} d`}
              detalle={consumoDiario > 0 ? `Consumo ${(Math.round(consumoDiario * 100) / 100).toString()}/día` : ''}
              color={
                diasParaAgotarse !== null && diasParaAgotarse <= 7
                  ? 'text-red-700'
                  : diasParaAgotarse !== null && diasParaAgotarse <= 14
                  ? 'text-amber-700'
                  : 'text-gray-800'
              }
            />
          </div>
        </div>

        {/* Historial de movimientos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Historial de movimientos
            </h2>
            <span className="text-sm text-gray-500">
              Últimos {Math.min(movimientos.length, 100)} registros
            </span>
          </div>
          {movimientos.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Este producto aún no tiene movimientos registrados.
            </p>
          ) : (
            <>
              {/* Vista escritorio */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Origen</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {formatearFechaHora(m.creadoEn)}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              m.tipo === 'entrada'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                          </span>
                        </td>
                        <td className={`px-4 py-2 text-sm font-semibold text-right whitespace-nowrap ${
                          m.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {m.venta ? (
                            <span className="text-emerald-700">
                              Venta #{m.venta.id} (${m.venta.total.toLocaleString('es-MX')})
                            </span>
                          ) : (
                            <span className="text-gray-500">Manual</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">
                          {m.notas || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div className="lg:hidden divide-y divide-gray-200">
                {movimientos.map((m) => (
                  <div key={m.id} className="py-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">
                          {formatearFechaHora(m.creadoEn)}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {m.venta ? (
                            <>Venta #{m.venta.id}</>
                          ) : (
                            <>Manual{m.notas ? ` — ${m.notas}` : ''}</>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                            m.tipo === 'entrada'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </span>
                        <span className={`text-base font-bold mt-1 ${
                          m.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {puedeExportar && movimientos.length > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-right">
              ¿Necesitas todo el historial? Usa Análisis → Exportar a Excel.
            </p>
          )}
        </div>
      </div>
    </LayoutProtegido>
  )
}

function Metrica({
  titulo,
  valor,
  detalle,
  color = 'text-gray-800',
}: {
  titulo: string
  valor: string
  detalle?: string
  color?: string
}) {
  return (
    <div className="bg-gray-50 rounded-md p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{titulo}</div>
      <div className={`text-xl font-bold mt-1 ${color}`}>{valor}</div>
      {detalle && <div className="text-xs text-gray-500 mt-0.5">{detalle}</div>}
    </div>
  )
}
