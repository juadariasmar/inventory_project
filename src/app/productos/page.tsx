import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import Link from 'next/link'
import ListaProductosFiltrable from '@/componentes/productos/ListaProductosFiltrable'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'

import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PaginaProductos() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId

  const [productos, categorias, puedeRealizarVentas, puedeRegistrar] =
    await Promise.all([
      prisma.producto.findMany({
        where: { empresaId },
        include: { categoria: true },
        orderBy: { nombre: 'asc' },
      }),
      prisma.categoria.findMany({
        where: { empresaId },
        orderBy: { nombre: 'asc' },
      }),
      tienePermiso('REALIZAR_VENTAS'),
      tienePermiso('REGISTRAR_MOVIMIENTOS'),
    ])
  const esAdmin = sesion.user.rol === 'ADMIN' || sesion.user.rol === 'SUPER_ADMIN'
  const puedeVender = puedeRealizarVentas || puedeRegistrar

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          {esAdmin && (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/productos/categorias"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm"
              >
                Gestionar categorías
              </Link>
              <Link
                href="/productos/importar"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm"
              >
                Importar CSV
              </Link>
              <Link
                href="/productos/nuevo"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
              >
                + Nuevo Producto
              </Link>
            </div>
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
