import BotonVolverCerrar from '@/componentes/ventas/BotonVolverCerrar'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'
import { formatearFechaHora } from '@/lib/fechas'
import BotonImprimir from '@/componentes/comunes/BotonImprimir'
import BotonCancelarVenta from '@/componentes/ventas/BotonCancelarVenta'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaginaReciboVenta({ params }: Props) {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId

  const { id } = await params
  const ventaId = parseInt(id, 10)
  if (!ventaId || Number.isNaN(ventaId)) notFound()

  const venta = await prisma.venta.findUnique({
    where: { id: ventaId, empresaId },
    include: {
      vendedor: { select: { id: true, nombre: true, email: true } },
      canceladaPor: { select: { id: true, nombre: true, email: true } },
      items: {
        include: { producto: { select: { nombre: true, codigo: true } } },
      },
    },
  })
  if (!venta) notFound()

  // Solo admin o quien hizo la venta puede ver el recibo.
  const esAdmin = sesion.user.rol === 'ADMIN'
  const esVendedor = venta.vendedorId !== null && sesion.user.id === venta.vendedorId
  if (!esAdmin && !esVendedor) redirect('/')

  const cantidadTotalItems = venta.items.reduce((s, it) => s + it.cantidad, 0)

  // Ventana de cancelacion: solo ADMIN y solo el mismo dia calendario.
  const hoy = new Date()
  const esMismoDia =
    venta.creadoEn.getFullYear() === hoy.getFullYear() &&
    venta.creadoEn.getMonth() === hoy.getMonth() &&
    venta.creadoEn.getDate() === hoy.getDate()
  const puedeCancelar = esAdmin && esMismoDia && !venta.canceladaEn

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white py-6 px-4">
      {/* Barra superior con acciones (oculta al imprimir) */}
      <div className="max-w-2xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <BotonVolverCerrar />
        <div className="flex items-center gap-2">
          {puedeCancelar && <BotonCancelarVenta ventaId={venta.id} />}
          <BotonImprimir />
        </div>
      </div>

      {/* Recibo (estilo ticket sobre papel A4 simulado) */}
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 print:shadow-none print:rounded-none print:max-w-full print:p-4">
        {venta.canceladaEn && (
          <div className="mb-4 p-4 border-2 border-red-300 bg-red-50 rounded text-center">
            <div className="text-lg font-bold text-red-700 tracking-wider">
              VENTA CANCELADA
            </div>
            <div className="text-xs text-red-700 mt-1">
              Cancelada el {formatearFechaHora(venta.canceladaEn)}
              {venta.canceladaPor
                ? ` por ${venta.canceladaPor.nombre} (@${venta.canceladaPor.email})`
                : ''}
            </div>
            {venta.motivoCancelacion && (
              <div className="text-sm text-red-800 mt-2">
                Motivo: {venta.motivoCancelacion}
              </div>
            )}
            <div className="text-xs text-red-700 mt-2">
              El stock fue devuelto al inventario.
            </div>
          </div>
        )}

        {/* Encabezado */}
        <div className="text-center pb-4 border-b border-gray-300">
          <h1 className="text-xl font-bold text-gray-800">Sistema de Inventario</h1>
          <p className="text-sm text-gray-600 mt-1">Comprobante de venta</p>
        </div>

        {/* Datos de la venta */}
        <div className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div>
            <div className="text-xs text-gray-500 uppercase">Venta N.°</div>
            <div className="text-2xl font-bold text-gray-800">#{venta.id}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase">Fecha y hora</div>
            <div className="font-medium text-gray-800">{formatearFechaHora(venta.creadoEn)}</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-gray-500 uppercase">Vendedor</div>
            <div className="font-medium text-gray-800">
              {venta.vendedor
                ? `${venta.vendedor.nombre} (@${venta.vendedor.email})`
                : '(usuario eliminado)'}
            </div>
          </div>
          {venta.notas && (
            <div className="col-span-2">
              <div className="text-xs text-gray-500 uppercase">Notas</div>
              <div className="text-gray-800">{venta.notas}</div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border-t border-gray-300 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 font-semibold text-gray-700">Producto</th>
                <th className="text-center py-2 font-semibold text-gray-700">Cant.</th>
                <th className="text-right py-2 font-semibold text-gray-700">Precio</th>
                <th className="text-right py-2 font-semibold text-gray-700">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.items.map((it) => (
                <tr key={it.id} className="border-b border-gray-200">
                  <td className="py-2">
                    <div className="font-medium text-gray-800">{it.producto.nombre}</div>
                    <div className="text-xs text-gray-500">{it.producto.codigo}</div>
                  </td>
                  <td className="py-2 text-center">{it.cantidad}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    ${it.precioUnitario.toLocaleString('es-MX')}
                  </td>
                  <td className="py-2 text-right font-semibold whitespace-nowrap">
                    ${it.subtotal.toLocaleString('es-MX')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="pt-4 mt-2 border-t-2 border-gray-800">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-xs text-gray-500">
                {venta.items.length} producto(s) · {cantidadTotalItems} unidad(es)
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase">Total</div>
              <div className="text-3xl font-bold text-gray-800">
                ${venta.total.toLocaleString('es-MX')}
              </div>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Gracias por su compra.</p>
          <p className="mt-1">
            Generado por el Sistema de Inventario · {formatearFechaHora(new Date())}
          </p>
        </div>
      </div>

      {/* Estilos de impresion */}
      <style>{`
        @media print {
          @page { margin: 1cm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}
