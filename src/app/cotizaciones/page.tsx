import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { formatearFechaHora } from '@/lib/fechas'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ estado?: string }>
}

// Estado mostrado al usuario, derivado del estado en BD + vigencia.
// PENDIENTE en BD con validaHasta <= now se muestra como VENCIDA.
type EstadoMostrado = 'PENDIENTE' | 'VENCIDA' | 'CONVERTIDA' | 'CANCELADA'

function colorBadge(estado: EstadoMostrado) {
  switch (estado) {
    case 'PENDIENTE':
      return 'bg-blue-100 text-blue-800'
    case 'VENCIDA':
      return 'bg-gray-200 text-gray-700'
    case 'CONVERTIDA':
      return 'bg-emerald-100 text-emerald-800'
    case 'CANCELADA':
      return 'bg-red-100 text-red-800'
  }
}

export default async function PaginaCotizaciones({ searchParams }: Props) {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId
  const esAdmin = sesion.user.rol === 'ADMIN'
  const puedeVender = await tienePermiso('REALIZAR_VENTAS')
  if (!esAdmin && !puedeVender) redirect('/')

  const params = await searchParams
  const filtroEstado = params.estado

  const where: {
    empresaId: string
    vendedorId?: string
    estado?: 'PENDIENTE' | 'CONVERTIDA' | 'CANCELADA'
  } = { empresaId }
  if (!esAdmin) where.vendedorId = sesion.user.id
  if (
    filtroEstado === 'PENDIENTE' ||
    filtroEstado === 'CONVERTIDA' ||
    filtroEstado === 'CANCELADA'
  ) {
    where.estado = filtroEstado
  }

  const cotizaciones = await prisma.cotizacion.findMany({
    where,
    include: {
      vendedor: { select: { nombre: true, email: true } },
      cliente: { select: { nombre: true } },
      _count: { select: { items: true } },
    },
    orderBy: { creadoEn: 'desc' },
    take: 200,
  })

  const hoy = new Date()
  const estadoMostrado = (c: typeof cotizaciones[number]): EstadoMostrado => {
    if (c.estado === 'PENDIENTE' && c.validaHasta <= hoy) return 'VENCIDA'
    return c.estado
  }

  const linkFiltro = (estado: string | null) => {
    if (!estado) return '/cotizaciones'
    return `/cotizaciones?estado=${estado}`
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Cotizaciones</h1>
            <p className="text-sm text-gray-500 mt-1">
              {esAdmin
                ? 'Todas las cotizaciones del sistema.'
                : 'Tus cotizaciones.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm self-start"
            >
              ← Volver a panel
            </Link>
            <Link
              href="/cotizaciones/nueva"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm self-start"
            >
              + Nueva cotización
            </Link>
          </div>
        </div>

        {/* Filtros por estado */}
        <div className="flex flex-wrap gap-2 text-sm">
          {(
            [
              { v: null, etiqueta: 'Todas' },
              { v: 'PENDIENTE', etiqueta: 'Pendientes' },
              { v: 'CONVERTIDA', etiqueta: 'Convertidas' },
              { v: 'CANCELADA', etiqueta: 'Canceladas' },
            ] as { v: string | null; etiqueta: string }[]
          ).map(({ v, etiqueta }) => {
            const activo = (filtroEstado ?? null) === v
            return (
              <Link
                key={etiqueta}
                href={linkFiltro(v)}
                className={`px-3 py-1.5 rounded-md border ${
                  activo
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {etiqueta}
              </Link>
            )
          })}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {cotizaciones.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No hay cotizaciones que coincidan con el filtro.
            </div>
          ) : (
            <>
              {/* Vista escritorio */}
              <div className="hidden lg:block">
                <table className="w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[8%]">N.°</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[12%]">Estado</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[16%]">Fecha</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[16%]">Válida hasta</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[18%]">Cliente / Vendedor</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase w-[10%]">Items</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase w-[12%]">Total</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[8%]">Ver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cotizaciones.map((c) => {
                      const estado = estadoMostrado(c)
                      return (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">
                            #{c.id}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${colorBadge(estado)}`}>
                              {estado}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                            {formatearFechaHora(c.creadoEn)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                            {formatearFechaHora(c.validaHasta)}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700 break-words">
                            {c.cliente?.nombre && (
                              <div className="font-medium text-gray-800">{c.cliente.nombre}</div>
                            )}
                            <div className="text-xs text-gray-500">
                              {c.vendedor
                                ? `${c.vendedor.nombre} (@${c.vendedor.email})`
                                : 'Vendedor eliminado'}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                            {c._count.items}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-800">
                            ${c.total.toLocaleString('es-MX')}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm">
                            <Link
                              href={`/cotizaciones/${c.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Detalle →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div className="lg:hidden divide-y divide-gray-200">
                {cotizaciones.map((c) => {
                  const estado = estadoMostrado(c)
                  return (
                    <Link
                      key={c.id}
                      href={`/cotizaciones/${c.id}`}
                      className="block p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900">#{c.id}</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colorBadge(estado)}`}>
                              {estado}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatearFechaHora(c.creadoEn)}
                          </div>
                          {c.cliente?.nombre && (
                            <div className="text-sm font-medium text-gray-800 mt-1 truncate">
                              {c.cliente.nombre}
                            </div>
                          )}
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <div className="font-semibold text-gray-800">
                            ${c.total.toLocaleString('es-MX')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {c._count.items} item(s)
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </LayoutProtegido>
  )
}
