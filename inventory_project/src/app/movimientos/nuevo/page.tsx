import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import FormularioMovimiento from '@/componentes/FormularioMovimiento'
import Link from 'next/link'

async function obtenerProductos() {
  return await prisma.producto.findMany({
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      codigo: true,
      cantidad: true,
    },
  })
}

export default async function PaginaNuevoMovimiento() {
  const productos = await obtenerProductos()

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/movimientos" className="hover:text-blue-600">
            Movimientos
          </Link>
          <span>/</span>
          <span>Nuevo</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Registrar Movimiento</h1>

        {productos.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <FormularioMovimiento productos={productos} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 mb-4">
              No hay productos registrados. Primero debes crear al menos un producto.
            </p>
            <Link
              href="/productos/nuevo"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Crear Producto
            </Link>
          </div>
        )}
      </div>
    </LayoutProtegido>
  )
}
