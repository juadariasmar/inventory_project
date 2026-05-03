import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import FormularioProducto from '@/componentes/FormularioProducto'
import Link from 'next/link'

async function obtenerCategorias() {
  return await prisma.categoria.findMany({
    orderBy: { nombre: 'asc' },
  })
}

export default async function PaginaNuevoProducto() {
  const categorias = await obtenerCategorias()

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/productos" className="hover:text-blue-600">
            Productos
          </Link>
          <span>/</span>
          <span>Nuevo</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Nuevo Producto</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <FormularioProducto categorias={categorias} />
        </div>
      </div>
    </LayoutProtegido>
  )
}
