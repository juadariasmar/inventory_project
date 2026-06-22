import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import TerminalVentaRapida from '@/componentes/TerminalVentaRapida'
import { redirect } from 'next/navigation'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

export default async function PaginaVentaRapida() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId

  const puedeVender =
    (await tienePermiso('REALIZAR_VENTAS')) ||
    (await tienePermiso('REGISTRAR_MOVIMIENTOS'))
  if (!puedeVender) {
    redirect('/')
  }

  const vendedorId = sesion.user.id
  // Rango de "hoy" en hora local Colombia: desde 00:00 hasta 23:59:59.
  const hoyDesde = new Date()
  hoyDesde.setHours(0, 0, 0, 0)
  const hoyHasta = new Date()
  hoyHasta.setHours(23, 59, 59, 999)

  const [productos, ventasRecientes, ventasDeHoy] = await Promise.all([
    prisma.producto.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
      select: { id: true, codigo: true, nombre: true, precio: true, cantidad: true },
    }),
    prisma.venta.findMany({
      where: { empresaId, vendedorId, canceladaEn: null },
      include: { _count: { select: { items: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 5,
    }),
    prisma.venta.aggregate({
      where: {
        empresaId,
        vendedorId,
        creadoEn: { gte: hoyDesde, lte: hoyHasta },
        canceladaEn: null,
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ])

  const recientesSerializadas = ventasRecientes.map((v) => ({
    id: v.id,
    total: v.total,
    totalItems: v._count.items,
    creadoEn: v.creadoEn.toISOString(),
  }))

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
          <p className="text-sm text-gray-600">
            Terminal de ventas. Cada venta registrada se guarda como un
            movimiento de salida en el inventario.
          </p>
        </div>

        {productos.length > 0 ? (
          <TerminalVentaRapida
            productos={productos}
            recientes={recientesSerializadas}
            totalHoy={ventasDeHoy._sum.total ?? 0}
            ventasHoy={ventasDeHoy._count._all}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            No hay productos registrados. Primero crea al menos un producto en
            la sección de Productos.
          </div>
        )}
      </div>
    </LayoutProtegido>
  )
}
