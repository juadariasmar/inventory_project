import LayoutProtegido from '@/componentes/LayoutProtegido'
import FormularioProveedor from '@/componentes/FormularioProveedor'
import Link from 'next/link'
import { obtenerSesion } from '@/lib/permisos'
import { redirect } from 'next/navigation'

export default async function PaginaNuevoProveedor() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  if (sesion.user.rol !== 'ADMIN') redirect('/')

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/proveedores" className="hover:text-blue-600">
            Proveedores
          </Link>
          <span>/</span>
          <span>Nuevo</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Nuevo proveedor</h1>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <FormularioProveedor />
        </div>
      </div>
    </LayoutProtegido>
  )
}
