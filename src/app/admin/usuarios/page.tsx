import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import ListaUsuariosFiltrable from '@/componentes/usuarios/ListaUsuariosFiltrable'
import GestorInvitaciones from '@/componentes/usuarios/GestorInvitaciones'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

export default async function PaginaUsuarios() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId || (sesion.user.rol !== 'ADMIN' && sesion.user.rol !== 'SUPER_ADMIN')) {
    redirect('/')
  }
  const empresaId = sesion.user.empresaId

  const [usuarios, empresa, invitaciones] = await Promise.all([
    prisma.usuario.findMany({
      where: { empresaId },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        creadoEn: true,
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { nombre: true },
    }),
    prisma.invitacion.findMany({
      where: { empresaId },
      orderBy: { creadoEn: 'desc' },
      include: {
        creadoPor: { select: { id: true, nombre: true } },
      },
    }),
  ])

  const pendientes = usuarios.filter((u) => u.estado === 'PENDIENTE').length

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
            <p className="text-sm text-gray-500">{empresa?.nombre ?? 'Empresa'}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/usuarios/nuevo"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
            >
              + Nuevo Usuario
            </Link>
          </div>
        </div>

        {pendientes > 0 && (
          <div
            role="status"
            className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {pendientes === 1
              ? 'Tienes 1 usuario pendiente de aprobación.'
              : `Tienes ${pendientes} usuarios pendientes de aprobación.`}
          </div>
        )}

        <ListaUsuariosFiltrable
          usuarios={usuarios}
          usuarioActualId={sesion.user.id}
        />

        <GestorInvitaciones
          invitaciones={invitaciones}
        />
      </div>
    </LayoutProtegido>
  )
}
