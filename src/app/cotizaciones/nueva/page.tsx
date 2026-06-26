import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import FormularioCotizacion from '@/componentes/ventas/FormularioCotizacion'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { obtenerReservasPorProducto } from '@/lib/reservas'

export const dynamic = 'force-dynamic'

export default async function PaginaNuevaCotizacion() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId
  const esAdmin = sesion.user.rol === 'ADMIN' || sesion.user.rol === 'SUPER_ADMIN'
  if (!esAdmin && !(await tienePermiso('REALIZAR_VENTAS'))) redirect('/')

  const productos = await prisma.producto.findMany({
    where: { empresaId },
    orderBy: { nombre: 'asc' },
    select: { id: true, codigo: true, nombre: true, precio: true, cantidad: true },
  })
  const reservas = await obtenerReservasPorProducto(productos.map((p) => p.id), undefined, empresaId)

  const productosConDisponible = productos.map((p) => ({
    ...p,
    disponible: Math.max(0, p.cantidad - (reservas.get(p.id) ?? 0)),
  }))

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/cotizaciones" className="hover:text-blue-600">
            Cotizaciones
          </Link>
          <span>/</span>
          <span className="text-gray-800">Nueva</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nueva cotización</h1>
          <p className="text-sm text-gray-500 mt-1">
            Una cotización reserva el stock de los productos seleccionados durante
            el plazo de validez. No descuenta inventario hasta que se convierte
            en venta.
          </p>
        </div>

        <FormularioCotizacion productos={productosConDisponible} />
      </div>
    </LayoutProtegido>
  )
}
