import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import FormularioProveedor from '@/componentes/compras/FormularioProveedor'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'
import { notFound, redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaginaEditarProveedor({ params }: Props) {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  if (sesion.user.rol !== 'ADMIN') redirect('/')
  const empresaId = sesion.user.empresaId

  const { id } = await params
  const proveedorId = parseInt(id, 10)
  if (!proveedorId || Number.isNaN(proveedorId)) notFound()

  const proveedor = await prisma.proveedor.findFirst({
    where: { id: proveedorId, empresaId },
  })
  if (!proveedor) notFound()

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/proveedores" className="hover:text-blue-600">
            Proveedores
          </Link>
          <span>/</span>
          <span>{proveedor.nombre}</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Editar proveedor</h1>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <FormularioProveedor proveedor={proveedor} />
        </div>
      </div>
    </LayoutProtegido>
  )
}
