import { prisma } from '@/lib/db'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import Link from 'next/link'
import ListaMovimientosFiltrable from '@/componentes/ListaMovimientosFiltrable'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PaginaMovimientos() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId

  const [movimientos, puedeRegistrar] = await Promise.all([
    prisma.movimiento.findMany({
      where: { empresaId },
      include: { producto: true },
      orderBy: { creadoEn: 'desc' },
    }),
    tienePermiso('REGISTRAR_MOVIMIENTOS'),
  ])
  const esAdmin = sesion.user.rol === 'ADMIN'

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Movimientos de Inventario</h1>
          {puedeRegistrar && (
            <Link
              href="/movimientos/nuevo"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-center"
            >
              + Registrar Movimiento
            </Link>
          )}
        </div>

        <ListaMovimientosFiltrable movimientos={movimientos} esAdmin={esAdmin} />
      </div>
    </LayoutProtegido>
  )
}
