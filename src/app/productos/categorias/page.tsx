import Link from 'next/link'
import { redirect } from 'next/navigation'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import PanelCategorias from '@/componentes/PanelCategorias'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

export default async function PaginaGestionarCategorias() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'ADMIN') {
    redirect('/')
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) redirect('/auth/sign-in')

  const categorias = await prisma.categoria.findMany({
    where: { empresaId },
    include: {
      _count: { select: { productos: true } },
      productos: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
          cantidad: true,
          stockMinimo: true,
          precio: true,
        },
        orderBy: { nombre: 'asc' },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  const categoriasIniciales = categorias.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    prefijo: c.prefijo,
    productosCount: c._count.productos,
    productos: c.productos,
  }))

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/productos" className="hover:text-blue-600">
            Productos
          </Link>
          <span>/</span>
          <span className="text-gray-800">Categorías</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
            <p className="text-sm text-gray-500 mt-1">
              Las categorías agrupan productos del catálogo. Cada producto puede
              tener una categoría asignada.
            </p>
          </div>
          <Link
            href="/productos"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm self-start"
          >
            ← Volver a Productos
          </Link>
        </div>

        <PanelCategorias categoriasIniciales={categoriasIniciales} />
      </div>
    </LayoutProtegido>
  )
}
