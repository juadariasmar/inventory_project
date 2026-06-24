import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import { obtenerSesion, esAdmin } from '@/lib/permisos'
import VistaSugerencias from './VistaSugerencias'

export const dynamic = 'force-dynamic'

export default async function PaginaSugerencias() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') {
    redirect('/auth/sign-in')
  }
  if (!(await esAdmin())) {
    redirect('/')
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Panel</Link>
          <span>/</span>
          <span className="text-gray-800">Sugerencias de compra</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sugerencias de compra</h1>
          <p className="text-sm text-gray-500 mt-1">
            Productos con stock bajo. Selecciona los que deseas comprar y asígnalos a un proveedor para crear órdenes automáticamente.
          </p>
        </div>

        <VistaSugerencias />
      </div>
    </LayoutProtegido>
  )
}
