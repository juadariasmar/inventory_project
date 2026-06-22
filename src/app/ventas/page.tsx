import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import FiltrosVentas from '@/componentes/ventas/FiltrosVentas'
import BotonCancelarVenta from '@/componentes/ventas/BotonCancelarVenta'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { formatearFechaHora } from '@/lib/fechas'
import type { Prisma } from '@prisma/client'

function esHoy(fecha: Date, hoy: Date) {
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  )
}

export const dynamic = 'force-dynamic'

const POR_PAGINA = 25

interface Props {
  searchParams: Promise<{
    vendedor?: string
    desde?: string
    hasta?: string
    pagina?: string
  }>
}

export default async function PaginaVentas({ searchParams }: Props) {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId

  const esAdmin = sesion.user.rol === 'ADMIN'
  const puedeRealizarVentas = await tienePermiso('REALIZAR_VENTAS')
  // Acceso: admin o quien tenga REALIZAR_VENTAS para ver al menos las suyas.
  if (!esAdmin && !puedeRealizarVentas) redirect('/')

  const params = await searchParams
  const pagina = Math.max(1, parseInt(params.pagina ?? '1') || 1)

  const where: Prisma.VentaWhereInput = { empresaId }
  // Usuario regular solo ve sus propias ventas.
  if (!esAdmin) {
    where.vendedorId = sesion.user.id
  } else if (params.vendedor) {
    where.vendedorId = params.vendedor
  }
  if (params.desde || params.hasta) {
    where.creadoEn = {}
    if (params.desde) (where.creadoEn as Prisma.DateTimeFilter).gte = new Date(params.desde + 'T00:00:00')
    if (params.hasta) (where.creadoEn as Prisma.DateTimeFilter).lte = new Date(params.hasta + 'T23:59:59.999')
  }

  const [total, ventas, vendedores] = await Promise.all([
    prisma.venta.count({ where }),
    prisma.venta.findMany({
      where,
      include: {
        vendedor: { select: { id: true, nombre: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { creadoEn: 'desc' },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    esAdmin
      ? prisma.usuario.findMany({
          where: { ventas: { some: {} }, empresaId },
          select: { id: true, nombre: true, email: true },
          orderBy: { nombre: 'asc' },
        })
      : Promise.resolve([]),
  ])

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  // Las canceladas no suman al ingreso de la pagina.
  const totalIngreso = ventas.reduce((s, v) => s + (v.canceladaEn ? 0 : v.total), 0)
  const canceladasEnPagina = ventas.filter((v) => v.canceladaEn).length
  const hoy = new Date()

  const urlPagina = (p: number) => {
    const qp = new URLSearchParams()
    if (params.vendedor && esAdmin) qp.set('vendedor', params.vendedor)
    if (params.desde) qp.set('desde', params.desde)
    if (params.hasta) qp.set('hasta', params.hasta)
    if (p > 1) qp.set('pagina', String(p))
    const qs = qp.toString()
    return qs ? `/ventas?${qs}` : '/ventas'
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Historial de ventas</h1>
            <p className="text-sm text-gray-500 mt-1">
              {esAdmin
                ? 'Todas las ventas registradas en el sistema.'
                : 'Tus ventas registradas.'}
            </p>
          </div>
          {puedeRealizarVentas || esAdmin ? (
            <Link
              href="/venta-rapida"
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm self-start"
            >
              + Nueva venta
            </Link>
          ) : null}
        </div>

        <FiltrosVentas esAdmin={esAdmin} vendedores={vendedores} />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex flex-wrap justify-between items-center gap-2 text-sm">
            <div className="text-gray-600">
              Total: <strong>{total}</strong> venta(s)
              {total > 0 && (
                <>
                  {' '}· Ingresos en esta página:{' '}
                  <strong>${totalIngreso.toLocaleString('es-MX')}</strong>
                  {canceladasEnPagina > 0 && (
                    <span className="text-gray-500">
                      {' '}({canceladasEnPagina} cancelada{canceladasEnPagina !== 1 ? 's' : ''} no suma{canceladasEnPagina === 1 ? '' : 'n'})
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="text-gray-600">
              Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
            </div>
          </div>

          {ventas.length > 0 ? (
            <>
              {/* Vista escritorio */}
              <div className="hidden lg:block">
                <table className="w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[8%]">N.°</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[20%]">Fecha y hora</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[24%]">Vendedor</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase w-[12%]">Productos</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase w-[16%]">Total</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[20%]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ventas.map((v) => (
                      <tr key={v.id} className={`hover:bg-gray-50 ${v.canceladaEn ? 'bg-red-50/40' : ''}`}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>#{v.id}</span>
                            {v.canceladaEn && (
                              <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                CANCELADA
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                          {formatearFechaHora(v.creadoEn)}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700 break-words">
                          {v.vendedor ? (
                            <>
                              <div className="font-medium">{v.vendedor.nombre}</div>
                              <div className="text-xs text-gray-500">@{v.vendedor.email}</div>
                            </>
                          ) : (
                            <span className="italic text-gray-400">(usuario eliminado)</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                          {v._count.items}
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap text-right text-sm font-semibold ${v.canceladaEn ? 'text-gray-400 line-through' : 'text-emerald-700'}`}>
                          ${v.total.toLocaleString('es-MX')}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/ventas/${v.id}/recibo`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Recibo
                            </Link>
                            {esAdmin && !v.canceladaEn && esHoy(v.creadoEn, hoy) && (
                              <BotonCancelarVenta ventaId={v.id} variante="compact" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div className="lg:hidden divide-y divide-gray-200">
                {ventas.map((v) => (
                  <div key={v.id} className={`p-4 ${v.canceladaEn ? 'bg-red-50/40' : ''}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-mono font-bold text-gray-900">Venta #{v.id}</div>
                          {v.canceladaEn && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                              CANCELADA
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{formatearFechaHora(v.creadoEn)}</div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className={`font-semibold ${v.canceladaEn ? 'text-gray-400 line-through' : 'text-emerald-700'}`}>
                          ${v.total.toLocaleString('es-MX')}
                        </div>
                        <div className="text-xs text-gray-500">{v._count.items} producto(s)</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Vendedor:{' '}
                      {v.vendedor ? (
                        <span className="font-medium">
                          {v.vendedor.nombre} (@{v.vendedor.email})
                        </span>
                      ) : (
                        <span className="italic text-gray-400">(eliminado)</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <Link
                        href={`/ventas/${v.id}/recibo`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Ver recibo →
                      </Link>
                      {esAdmin && !v.canceladaEn && esHoy(v.creadoEn, hoy) && (
                        <BotonCancelarVenta ventaId={v.id} variante="compact" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {(params.vendedor || params.desde || params.hasta)
                ? 'No hay ventas que coincidan con los filtros.'
                : esAdmin
                ? 'No hay ventas registradas todavía.'
                : 'Aún no has registrado ninguna venta.'}
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between text-sm">
              {pagina > 1 ? (
                <Link href={urlPagina(pagina - 1)} className="text-blue-600 hover:underline">
                  ← Anterior
                </Link>
              ) : (
                <span className="text-gray-300">← Anterior</span>
              )}
              <span className="text-gray-600">
                Página {pagina} / {totalPaginas}
              </span>
              {pagina < totalPaginas ? (
                <Link href={urlPagina(pagina + 1)} className="text-blue-600 hover:underline">
                  Siguiente →
                </Link>
              ) : (
                <span className="text-gray-300">Siguiente →</span>
              )}
            </div>
          )}
        </div>
      </div>
    </LayoutProtegido>
  )
}
