import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import FormularioOrdenCompra from '@/componentes/compras/FormularioOrdenCompra'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'
import { redirect } from 'next/navigation'

export default async function PaginaNuevaOrdenCompra() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  if (sesion.user.rol !== 'ADMIN' && sesion.user.rol !== 'SUPER_ADMIN') redirect('/')
  const empresaId = sesion.user.empresaId

  const [proveedores, productos] = await Promise.all([
    prisma.proveedor.findMany({
      where: { empresaId, activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.producto.findMany({
      where: { empresaId },
      select: { id: true, nombre: true, codigo: true, precio: true },
      orderBy: { nombre: 'asc' },
    }),
  ])

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/proveedores/ordenes" className="hover:text-blue-600">
            Órdenes de compra
          </Link>
          <span>/</span>
          <span>Nueva</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Nueva orden de compra</h1>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <FormularioOrdenCompra proveedores={proveedores} productos={productos} />
        </div>
      </div>
    </LayoutProtegido>
  )
}
