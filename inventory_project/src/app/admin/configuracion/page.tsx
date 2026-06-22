import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import BotonRestablecerDatos from '@/componentes/BotonRestablecerDatos'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

export default async function PaginaConfiguracion() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'ADMIN') {
    redirect('/')
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) redirect('/login')

  const [productos, categorias, movimientos, ventas, cotizaciones, auditorias] =
    await Promise.all([
      prisma.producto.count({ where: { empresaId } }),
      prisma.categoria.count({ where: { empresaId } }),
      prisma.movimiento.count({ where: { empresaId } }),
      prisma.venta.count({ where: { empresaId } }),
      prisma.cotizacion.count({ where: { empresaId } }),
      prisma.auditoria.count({ where: { empresaId } }),
    ])

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">
            Panel
          </Link>
          <span>/</span>
          <span className="text-gray-800">Configuración</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
          <p className="text-sm text-gray-500 mt-1">
            Acciones de administración avanzadas.
          </p>
        </div>

        <section className="bg-white rounded-lg shadow-md p-6 space-y-4 border-l-4 border-red-500">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Restablecer datos para simulación
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Borra <strong>todos</strong> los productos, categorías, movimientos,
              ventas, cotizaciones y entradas de auditoría para dejar el aplicativo
              listo para una nueva simulación. Tus usuarios y permisos se
              mantienen tal cual. Esta acción es irreversible.
            </p>
          </div>

          <BotonRestablecerDatos
            conteos={{
              productos,
              categorias,
              movimientos,
              ventas,
              cotizaciones,
              auditorias,
            }}
          />
        </section>
      </div>
    </LayoutProtegido>
  )
}
