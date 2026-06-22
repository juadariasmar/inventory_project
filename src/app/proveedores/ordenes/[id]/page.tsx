import LayoutProtegido from '@/componentes/LayoutProtegido'
import AccionesOrdenCompra from '@/componentes/AccionesOrdenCompra'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'
import { notFound, redirect } from 'next/navigation'
import { formatearFechaHora } from '@/lib/fechas'
import { formatearPrecio } from '@/lib/inventario'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

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

export default async function PaginaDetalleOrdenCompra({ params }: Props) {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId

  const { id } = await params
  const ordenId = parseInt(id, 10)
  if (!ordenId || Number.isNaN(ordenId)) notFound()

  const orden = await prisma.ordenCompra.findFirst({
    where: { id: ordenId, empresaId },
    include: {
      proveedor: true,
      items: {
        include: { producto: { select: { nombre: true, codigo: true } } },
      },
    },
  })
  if (!orden) notFound()

  const estado = orden.estado as EstadoOrden

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/proveedores/ordenes" className="hover:text-blue-600">
            Órdenes de compra
          </Link>
          <span>/</span>
          <span className="text-gray-800">#{orden.id}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">
                Orden de compra #{orden.id}
              </h1>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${colorEstado(
                  estado
                )}`}
              >
                {estado}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Creada {formatearFechaHora(orden.creadoEn)}
            </p>
          </div>
          <Link
            href={`/api/pdf/orden-compra/${orden.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-center"
          >
            Descargar PDF
          </Link>
        </div>

        {/* Cabecera */}
        <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Proveedor
            </p>
            <p className="text-sm text-gray-800 mt-1">{orden.proveedor.nombre}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </p>
            <p className="text-sm text-gray-800 mt-1">
              {formatearFechaHora(orden.creadoEn)}
            </p>
          </div>
          {orden.recibidaEn && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recibida
              </p>
              <p className="text-sm text-gray-800 mt-1">
                {formatearFechaHora(orden.recibidaEn)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </p>
            <p className="text-lg font-bold text-blue-700 mt-1">
              {formatearPrecio(orden.total)}
            </p>
          </div>
          {orden.notas && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notas
              </p>
              <p className="text-sm text-gray-800 mt-1">{orden.notas}</p>
            </div>
          )}
        </div>

        {/* Ítems */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-lg font-bold text-gray-800 px-6 pt-6">Ítems</h2>
          {/* Vista escritorio */}
          <div className="hidden lg:block overflow-x-auto mt-4">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo unitario
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orden.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3 text-sm text-gray-800">
                      <span className="font-medium">{item.producto.nombre}</span>
                      <span className="ml-2 text-xs text-gray-500 font-mono">
                        {item.producto.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600">
                      {item.cantidad}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600">
                      {formatearPrecio(item.costoUnitario)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-semibold text-gray-800">
                      {formatearPrecio(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td
                    colSpan={3}
                    className="px-6 py-3 text-sm font-medium text-gray-700 text-right"
                  >
                    Total
                  </td>
                  <td className="px-6 py-3 text-base font-bold text-blue-700 text-right">
                    {formatearPrecio(orden.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Vista móvil */}
          <div className="lg:hidden divide-y divide-gray-200 mt-4">
            {orden.items.map((item) => (
              <div key={item.id} className="px-6 py-3 space-y-1">
                <p className="text-sm font-medium text-gray-800">
                  {item.producto.nombre}
                  <span className="ml-2 text-xs text-gray-500 font-mono">
                    {item.producto.codigo}
                  </span>
                </p>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {item.cantidad} × {formatearPrecio(item.costoUnitario)}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {formatearPrecio(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
            <div className="px-6 py-3 flex justify-between items-baseline">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-base font-bold text-blue-700">
                {formatearPrecio(orden.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Acciones</h2>
          <AccionesOrdenCompra id={orden.id} estado={estado} />
        </div>
      </div>
    </LayoutProtegido>
  )
}
