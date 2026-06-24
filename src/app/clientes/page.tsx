import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import { obtenerSesion } from '@/lib/permisos'
import VistaClientes from './VistaClientes'

export const dynamic = 'force-dynamic'

export default async function PaginaClientes() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') {
    redirect('/auth/sign-in')
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Panel</Link>
          <span>/</span>
          <span className="text-gray-800">Clientes</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona el registro de tus clientes.</p>
        </div>

        <VistaClientes empresaId={sesion.user.empresaId} />
      </div>
    </LayoutProtegido>
  )
}
