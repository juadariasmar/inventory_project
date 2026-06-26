import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import FormularioProducto from '@/componentes/productos/FormularioProducto'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { obtenerSesion } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

export default async function PaginaNuevoProducto() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId

  const categorias = await prisma.categoria.findMany({
    where: { empresaId },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, prefijo: true },
  })

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <Link
          href="/productos"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
        >
          ← Volver a productos
        </Link>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/productos" className="hover:text-blue-600">
            Productos
          </Link>
          <span>/</span>
          <span>Nuevo</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Nuevo Producto</h1>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          {categorias.length === 0 ? (
            <div className="text-center space-y-3">
              <p className="text-gray-700">
                Para crear productos primero necesitas al menos una categoría.
              </p>
              <Link
                href="/productos/categorias"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Crear categoría
              </Link>
            </div>
          ) : (
            <FormularioProducto categorias={categorias} />
          )}
        </div>
      </div>
    </LayoutProtegido>
  )
}
