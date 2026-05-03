import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import Link from 'next/link'
import BotonEliminarCategoria from '@/componentes/BotonEliminarCategoria'

async function obtenerCategorias() {
  return await prisma.categoria.findMany({
    include: {
      _count: {
        select: { productos: true },
      },
    },
    orderBy: { nombre: 'asc' },
  })
}

export default async function PaginaCategorias() {
  const categorias = await obtenerCategorias()

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
          <Link
            href="/categorias/nueva"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            + Nueva Categoría
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.length > 0 ? (
            categorias.map((categoria) => (
              <div
                key={categoria.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {categoria.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {categoria._count.productos} producto
                      {categoria._count.productos !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <BotonEliminarCategoria
                    id={categoria.id}
                    nombre={categoria.nombre}
                    tieneProductos={categoria._count.productos > 0}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">
                No hay categorías registradas.{' '}
                <Link href="/categorias/nueva" className="text-blue-600 hover:underline">
                  Crear una nueva
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </LayoutProtegido>
  )
}
