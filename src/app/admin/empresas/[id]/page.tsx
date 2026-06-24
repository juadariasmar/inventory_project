import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

interface PaginaProps {
  params: Promise<{ id: string }>
}

export default async function PaginaDetalleEmpresa({ params }: PaginaProps) {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'ADMIN') {
    redirect('/')
  }

  const { id } = await params

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: {
      configuracion: true,
      usuarios: {
        orderBy: { creadoEn: 'desc' },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          estado: true,
          creadoEn: true,
        },
      },
      _count: {
        select: {
          usuarios: true,
          productos: true,
          categorias: true,
          Movimiento: true,
          ventas: true,
          cotizaciones: true,
          ordenesCompra: true,
          proveedores: true,
        },
      },
    },
  })

  if (!empresa) {
    notFound()
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Panel</Link>
          <span>/</span>
          <Link href="/admin" className="hover:text-blue-600">Administración</Link>
          <span>/</span>
          <span className="text-gray-800">{empresa.nombre}</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">{empresa.nombre}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Creada el {new Date(empresa.creadoEn).toLocaleDateString('es-CO', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Usuarios', valor: empresa._count.usuarios },
            { label: 'Productos', valor: empresa._count.productos },
            { label: 'Categorías', valor: empresa._count.categorias },
            { label: 'Movimientos', valor: empresa._count.Movimiento },
            { label: 'Ventas', valor: empresa._count.ventas },
            { label: 'Cotizaciones', valor: empresa._count.cotizaciones },
            { label: 'Órdenes de compra', valor: empresa._count.ordenesCompra },
            { label: 'Proveedores', valor: empresa._count.proveedores },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-border p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.valor}</p>
            </div>
          ))}
        </div>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Usuarios ({empresa.usuarios.length})
          </h2>
          {empresa.usuarios.length === 0 ? (
            <p className="text-sm text-gray-500">Esta empresa no tiene usuarios.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Nombre</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Rol</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {empresa.usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-900">{usuario.nombre}</td>
                      <td className="py-3 pr-4 text-gray-500">{usuario.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          usuario.rol === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          usuario.estado === 'ACTIVO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : usuario.estado === 'SUSPENDIDO'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {usuario.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Configuración
          </h2>
          {!empresa.configuracion ? (
            <p className="text-sm text-gray-500">
              Esta empresa no ha configurado su cuenta aún.
            </p>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Moneda</dt>
                <dd className="font-medium text-gray-900">{empresa.configuracion.moneda} ({empresa.configuracion.simboloMoneda})</dd>
              </div>
              <div>
                <dt className="text-gray-500">Impuestos</dt>
                <dd className="font-medium text-gray-900">{(empresa.configuracion.impuestos * 100).toFixed(0)}%</dd>
              </div>
              {empresa.configuracion.direccion && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Dirección</dt>
                  <dd className="font-medium text-gray-900">{empresa.configuracion.direccion}</dd>
                </div>
              )}
              {empresa.configuracion.telefono && (
                <div>
                  <dt className="text-gray-500">Teléfono</dt>
                  <dd className="font-medium text-gray-900">{empresa.configuracion.telefono}</dd>
                </div>
              )}
              {empresa.configuracion.email && (
                <div>
                  <dt className="text-gray-500">Email de contacto</dt>
                  <dd className="font-medium text-gray-900">{empresa.configuracion.email}</dd>
                </div>
              )}
              {empresa.configuracion.nombrePersonalizado && (
                <div>
                  <dt className="text-gray-500">Nombre personalizado</dt>
                  <dd className="font-medium text-gray-900">{empresa.configuracion.nombrePersonalizado}</dd>
                </div>
              )}
            </dl>
          )}
        </section>
      </div>
    </LayoutProtegido>
  )
}
