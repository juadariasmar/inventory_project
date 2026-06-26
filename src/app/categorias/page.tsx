import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import Link from 'next/link'
import BotonEliminarCategoria from '@/componentes/productos/BotonEliminarCategoria'
import { obtenerSesion } from '@/lib/permisos'

import { redirect } from 'next/navigation'

async function obtenerCategorias(empresaId: string) {
  return await prisma.categoria.findMany({
    where: { empresaId },
    include: {
      _count: {
        select: { productos: true },
      },
    },
    orderBy: { nombre: 'asc' },
  })
}

export default async function PaginaCategorias() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId

  const categorias = await obtenerCategorias(empresaId)
  const esAdmin = sesion.user.rol === 'ADMIN'

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
          <div className="flex gap-2">
            <Link
              href="/productos"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm self-start"
            >
              ← Volver a productos
            </Link>
            {esAdmin && (
              <Link
                href="/categorias/nueva"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-center"
              >
                + Nueva Categoría
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.length > 0 ? (
            categorias.map((categoria) => (
              <div
                key={categoria.id}
                className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                      {categoria.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {categoria._count.productos} producto
                      {categoria._count.productos !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {esAdmin && (
                    <BotonEliminarCategoria
                      id={categoria.id}
                      nombre={categoria.nombre}
                      tieneProductos={categoria._count.productos > 0}
                    />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">
                No hay categorías registradas.
                {esAdmin && (
                  <>
                    {' '}
                    <Link href="/categorias/nueva" className="text-blue-600 hover:underline">
                      Crear una nueva
                    </Link>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </LayoutProtegido>
  )
}
