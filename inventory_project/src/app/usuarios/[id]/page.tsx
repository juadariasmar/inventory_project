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
    select: { id: true, nombreUsuario: true, nombre: true, rol: true, permisos: true },
  })

  if (!usuario) {
    notFound()
  }

  // En las ramas de evaluacion de permisos la BD puede tener valores que
  // esta rama no reconoce (porque vienen de otras ramas). Los filtramos para
  // que la pagina y el formulario no caigan al intentar hidratarlos.
  const PERMISOS_RECONOCIDOS = new Set<string>([
    'VER_ANALISIS',
    'EXPORTAR_REPORTES',
    'REGISTRAR_MOVIMIENTOS',
    'REALIZAR_VENTAS',
  ])
  const usuarioSeguro = {
    ...usuario,
    permisos: (usuario.permisos as unknown as string[]).filter((p) =>
      PERMISOS_RECONOCIDOS.has(p)
    ),
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
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <FormularioUsuario usuario={usuarioSeguro as any} />
        </div>
      </div>
    </LayoutProtegido>
  )
}
