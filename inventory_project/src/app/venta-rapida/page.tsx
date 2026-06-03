import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import TerminalVentaRapida from '@/componentes/TerminalVentaRapida'
import { redirect } from 'next/navigation'
import { tienePermiso } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

async function obtenerProductos() {
  return await prisma.producto.findMany({
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      precio: true,
      cantidad: true,
    },
  })
}

export default async function PaginaVentaRapida() {
  const puedeVender =
    (await tienePermiso('REALIZAR_VENTAS')) ||
    (await tienePermiso('REGISTRAR_MOVIMIENTOS'))
  if (!puedeVender) {
    redirect('/')
  }
  const productos = await obtenerProductos()

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
          <TerminalVentaRapida productos={productos} />
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
