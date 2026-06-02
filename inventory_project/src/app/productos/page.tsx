import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import Link from 'next/link'
import ListaProductosFiltrable from '@/componentes/ListaProductosFiltrable'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

export default async function PaginaProductos() {
  const [productos, categorias, sesion, puedeRealizarVentas, puedeRegistrar] =
    await Promise.all([
      prisma.producto.findMany({
        include: { categoria: true },
        orderBy: { nombre: 'asc' },
      }),
      prisma.categoria.findMany({ orderBy: { nombre: 'asc' } }),
      obtenerSesion(),
      tienePermiso('REALIZAR_VENTAS'),
      tienePermiso('REGISTRAR_MOVIMIENTOS'),
    ])
  const esAdmin = sesion?.user?.rol === 'ADMIN'
  const puedeVender = puedeRealizarVentas || puedeRegistrar

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          {esAdmin && (
            <Link
              href="/productos/nuevo"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
            >
              + Nuevo Producto
            </Link>
          )}
        </div>

        <ListaProductosFiltrable
          productos={productos}
          categorias={categorias}
          esAdmin={esAdmin}
          puedeVender={puedeVender}
        />
      </div>
    </LayoutProtegido>
  )
}
