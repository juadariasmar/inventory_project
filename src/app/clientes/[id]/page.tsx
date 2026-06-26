import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

interface PaginaProps {
  params: Promise<{ id: string }>
}

export default async function PaginaCliente({ params }: PaginaProps) {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') {
    redirect('/auth/sign-in')
  }
  const empresaId = sesion.user.empresaId

  const { id } = await params
  const cliente = await prisma.cliente.findFirst({
    where: { id: parseInt(id, 10), empresaId },
    include: {
      ventas: { orderBy: { creadoEn: 'desc' }, take: 20 },
      cotizaciones: { where: { estado: 'PENDIENTE' }, orderBy: { creadoEn: 'desc' }, take: 10 },
      _count: { select: { ventas: true, cotizaciones: true } },
    },
  })
  if (!cliente) notFound()

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Panel</Link>
            <span>/</span>
            <Link href="/clientes" className="hover:text-blue-600">Clientes</Link>
            <span>/</span>
            <span className="text-gray-800">{cliente.nombre}</span>
          </div>
          <Link
            href="/clientes"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm self-start"
          >
            ← Volver a clientes
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">{cliente.nombre}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {cliente.documento && <div className="bg-white rounded-lg shadow-sm border p-3"><span className="text-gray-500">Documento</span><p className="font-medium">{cliente.documento}</p></div>}
          {cliente.email && <div className="bg-white rounded-lg shadow-sm border p-3"><span className="text-gray-500">Email</span><p className="font-medium">{cliente.email}</p></div>}
          {cliente.telefono && <div className="bg-white rounded-lg shadow-sm border p-3"><span className="text-gray-500">Teléfono</span><p className="font-medium">{cliente.telefono}</p></div>}
          {cliente.direccion && <div className="bg-white rounded-lg shadow-sm border p-3"><span className="text-gray-500">Dirección</span><p className="font-medium">{cliente.direccion}</p></div>}
        </div>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Historial de ventas ({cliente._count.ventas})</h2>
          {cliente.ventas.length === 0 ? (
            <p className="text-sm text-gray-500">Sin ventas registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 pr-4 font-medium">#</th>
                    <th className="pb-3 pr-4 font-medium">Fecha</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.ventas.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-gray-400 text-xs">#{v.id}</td>
                      <td className="py-3 pr-4">{new Date(v.creadoEn).toLocaleDateString('es-CO')}</td>
                      <td className="py-3 text-right font-medium">${v.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {cliente.cotizaciones.length > 0 && (
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Cotizaciones pendientes ({cliente.cotizaciones.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 pr-4 font-medium">#</th>
                    <th className="pb-3 pr-4 font-medium">Fecha</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.cotizaciones.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-gray-400 text-xs">#{c.id}</td>
                      <td className="py-3 pr-4">{new Date(c.creadoEn).toLocaleDateString('es-CO')}</td>
                      <td className="py-3 text-right font-medium">${c.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </LayoutProtegido>
  )
}
