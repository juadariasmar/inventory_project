import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import FormularioUsuario from '@/componentes/FormularioUsuario'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'

export default async function PaginaEditarUsuario({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'ADMIN') {
    redirect('/')
  }

  const { id } = await params
  const usuario = await prisma.usuario.findUnique({
    where: { id: parseInt(id, 10) },
    select: { id: true, nombreUsuario: true, nombre: true, rol: true },
  })

  if (!usuario) {
    notFound()
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/usuarios" className="hover:text-blue-600">
            Usuarios
          </Link>
          <span>/</span>
          <span>{usuario.nombreUsuario}</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Editar Usuario</h1>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-2xl">
          <FormularioUsuario usuario={usuario} />
        </div>
      </div>
    </LayoutProtegido>
  )
}
