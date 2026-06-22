import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import ListaUsuariosFiltrable from '@/componentes/ListaUsuariosFiltrable'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

export default async function PaginaUsuarios() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'ADMIN') {
    redirect('/')
  }

  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      creadoEn: true,
    },
    orderBy: { nombre: 'asc' },
  })

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <Link
            href="/usuarios/nuevo"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
          >
            + Nuevo Usuario
          </Link>
        </div>

        <ListaUsuariosFiltrable
          usuarios={usuarios}
          usuarioActualId={String(sesion.user.id)}
        />
      </div>
    </LayoutProtegido>
  )
}
