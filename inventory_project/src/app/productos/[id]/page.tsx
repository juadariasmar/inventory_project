import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import FormularioProducto from '@/componentes/FormularioProducto'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PropiedadesPagina {
  params: Promise<{ id: string }>
}

async function obtenerProducto(id: number) {
  return await prisma.producto.findUnique({
    where: { id },
    include: { categoria: true },
  })
}

async function obtenerCategorias() {
  return await prisma.categoria.findMany({
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, prefijo: true },
  })
}

export default async function PaginaEditarProducto({ params }: PropiedadesPagina) {
  const { id } = await params
  const productoId = parseInt(id)

  const [producto, categorias] = await Promise.all([
    obtenerProducto(productoId),
    obtenerCategorias(),
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
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/productos" className="hover:text-blue-600">
            Productos
          </Link>
          <span>/</span>
          <span>Editar</span>
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
