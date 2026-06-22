import Link from 'next/link'
import { redirect } from 'next/navigation'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import FormularioUsuario from '@/componentes/usuarios/FormularioUsuario'
import { obtenerSesion } from '@/lib/permisos'

export default async function PaginaNuevoUsuario() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'ADMIN') {
    redirect('/')
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/usuarios" className="hover:text-blue-600">
            Usuarios
          </Link>
          <span>/</span>
          <span>Nuevo</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Nuevo Usuario</h1>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-2xl">
          <FormularioUsuario />
        </div>
      </div>
    </LayoutProtegido>
  )
}
