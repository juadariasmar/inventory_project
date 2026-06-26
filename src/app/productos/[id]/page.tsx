import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import FormularioProducto from '@/componentes/productos/FormularioProducto'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PropiedadesPagina {
  params: Promise<{ id: string }>
}

import { redirect } from 'next/navigation'
import { obtenerSesion } from '@/lib/permisos'

async function obtenerProducto(empresaId: string, id: number) {
  return await prisma.producto.findUnique({
    where: { id, empresaId },
    include: { categoria: true },
  })
}

async function obtenerCategorias(empresaId: string) {
  return await prisma.categoria.findMany({
    where: { empresaId },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, prefijo: true },
  })
}

export default async function PaginaEditarProducto({ params }: PropiedadesPagina) {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId

  const { id } = await params
  const productoId = parseInt(id)

  const [producto, categorias] = await Promise.all([
    obtenerProducto(empresaId, productoId),
    obtenerCategorias(empresaId),
  ])

  if (!producto) {
    notFound()
  }

  const datosProducto = {
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion || '',
    codigo: producto.codigo,
    precio: producto.precio,
    cantidad: producto.cantidad,
    stockMinimo: producto.stockMinimo,
    categoriaId: producto.categoriaId,
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/productos" className="hover:text-blue-600">
              Productos
            </Link>
            <span>/</span>
            <span>Editar</span>
          </div>
          <Link
            href="/productos"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm self-start"
          >
            ← Volver a productos
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">
          Editar Producto: {producto.nombre}
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <FormularioProducto producto={datosProducto} categorias={categorias} />
        </div>
      </div>
    </LayoutProtegido>
  )
}
