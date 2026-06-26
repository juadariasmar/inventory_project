import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import BotonesCotizacion from '@/componentes/ventas/BotonesCotizacion'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { formatearFechaHora } from '@/lib/fechas'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

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

export default async function PaginaDetalleCotizacion({ params }: Props) {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId
  const esAdmin = sesion.user.rol === 'ADMIN' || sesion.user.rol === 'SUPER_ADMIN'
  const puedeVender = await tienePermiso('REALIZAR_VENTAS')
  if (!esAdmin && !puedeVender) redirect('/')

  const { id } = await params
  const cotizacionId = parseInt(id, 10)
  if (!cotizacionId || Number.isNaN(cotizacionId)) notFound()

  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id: cotizacionId, empresaId },
    include: {
      vendedor: { select: { id: true, nombre: true, email: true } },
      canceladaPor: { select: { id: true, nombre: true, email: true } },
      venta: { select: { id: true } },
      cliente: { select: { nombre: true } },
      items: {
        include: { producto: { select: { nombre: true, codigo: true } } },
      },
    },
  })
  if (!cotizacion) notFound()

  // Solo el vendedor original o admin pueden ver el detalle.
  const usuarioId = sesion.user.id
  if (!esAdmin && cotizacion.vendedorId !== usuarioId) redirect('/cotizaciones')

  const ahora = new Date()
  const vencida = cotizacion.estado === 'PENDIENTE' && cotizacion.validaHasta <= ahora
  const estadoMostrado: EstadoMostrado = vencida ? 'VENCIDA' : cotizacion.estado

  const esPropietarioOAdmin = esAdmin || cotizacion.vendedorId === usuarioId
  const puedeConvertir = esPropietarioOAdmin && cotizacion.estado === 'PENDIENTE' && !vencida
  const puedeCancelar = esPropietarioOAdmin && cotizacion.estado === 'PENDIENTE'

  const cantidadTotal = cotizacion.items.reduce((s, it) => s + it.cantidad, 0)

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/cotizaciones" className="hover:text-blue-600">
            Cotizaciones
          </Link>
          <span>/</span>
          <span className="text-gray-800">#{cotizacion.id}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">
                Cotización #{cotizacion.id}
              </h1>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${colorBadge(estadoMostrado)}`}>
                {estadoMostrado}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Creada {formatearFechaHora(cotizacion.creadoEn)}
              {cotizacion.vendedor &&
                ` por ${cotizacion.vendedor.nombre} (@${cotizacion.vendedor.email})`}
            </p>
          </div>
          <BotonesCotizacion
            cotizacionId={cotizacion.id}
            puedeConvertir={puedeConvertir}
            puedeCancelar={puedeCancelar}
          />
        </div>

        {/* Mensajes contextuales según estado */}
        {vencida && (
          <div className="border border-gray-300 bg-gray-50 rounded-md p-4 text-sm text-gray-700">
            La cotización venció el {formatearFechaHora(cotizacion.validaHasta)}.
            El stock reservado ya se liberó. Si la quieres revivir, créala de
            nuevo.
          </div>
        )}
        {cotizacion.estado === 'CONVERTIDA' && cotizacion.venta && (
          <div className="border border-emerald-300 bg-emerald-50 rounded-md p-4 text-sm text-emerald-800 flex items-center justify-between gap-2">
            <span>
              Convertida en venta el {cotizacion.convertidaEn ? formatearFechaHora(cotizacion.convertidaEn) : ''}.
            </span>
            <Link
              href={`/ventas/${cotizacion.venta.id}/recibo`}
              className="font-semibold underline hover:no-underline"
              target="_blank"
            >
              Ver recibo de venta #{cotizacion.venta.id} →
            </Link>
          </div>
        )}
        {cotizacion.estado === 'CANCELADA' && (
          <div className="border border-red-300 bg-red-50 rounded-md p-4 text-sm text-red-800 space-y-1">
            <div>
              Cancelada el {cotizacion.canceladaEn ? formatearFechaHora(cotizacion.canceladaEn) : ''}
              {cotizacion.canceladaPor &&
                ` por ${cotizacion.canceladaPor.nombre} (@${cotizacion.canceladaPor.email})`}
              .
            </div>
            {cotizacion.motivoCancelacion && (
              <div>Motivo: {cotizacion.motivoCancelacion}</div>
            )}
          </div>
        )}

        {/* Datos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-xs text-gray-500 uppercase">Cliente</div>
            <div className="text-base text-gray-800 mt-1">
              {cotizacion.cliente?.nombre || <span className="text-gray-400 italic">No especificado</span>}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-xs text-gray-500 uppercase">Válida hasta</div>
            <div className="text-base text-gray-800 mt-1">
              {formatearFechaHora(cotizacion.validaHasta)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-xs text-gray-500 uppercase">Total</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">
              ${cotizacion.total.toLocaleString('es-MX')}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-800">
              Items ({cotizacion.items.length} producto{cotizacion.items.length !== 1 ? 's' : ''} ·{' '}
              {cantidadTotal} unidad{cantidadTotal !== 1 ? 'es' : ''})
            </h2>
          </div>
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cotizacion.items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-800">{it.producto.nombre}</div>
                    <div className="text-xs text-gray-500 font-mono">{it.producto.codigo}</div>
                  </td>
                  <td className="px-3 py-2 text-right text-sm">{it.cantidad}</td>
                  <td className="px-3 py-2 text-right text-sm">
                    ${it.precioUnitario.toLocaleString('es-MX')}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-semibold">
                    ${it.subtotal.toLocaleString('es-MX')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cotizacion.notas && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-xs text-gray-500 uppercase mb-1">Notas</div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap">{cotizacion.notas}</div>
          </div>
        )}
      </div>
    </LayoutProtegido>
  )
}
