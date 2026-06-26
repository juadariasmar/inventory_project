import { redirect } from 'next/navigation'
import Link from 'next/link'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import FiltrosAuditoria from '@/componentes/admin/FiltrosAuditoria'
import DetalleAuditoria from '@/componentes/admin/DetalleAuditoria'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { formatearFechaHora } from '@/lib/fechas'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const POR_PAGINA = 50

interface Props {
  searchParams: Promise<{
    usuario?: string
    entidad?: string
    accion?: string
    desde?: string
    hasta?: string
    pagina?: string
  }>
}

const CLASES_ACCION: Record<string, string> = {
  CREAR: 'bg-green-100 text-green-800',
  ACTUALIZAR: 'bg-blue-100 text-blue-800',
  ELIMINAR: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGIN_FALLIDO: 'bg-orange-100 text-orange-800',
}

export default async function PaginaAuditoria({ searchParams }: Props) {
  const sesion = await obtenerSesion()
  const empresaId = sesion?.user?.empresaId
  if (!empresaId || (sesion?.user?.rol !== 'ADMIN' && sesion?.user?.rol !== 'SUPER_ADMIN')) redirect('/auth/sign-in')

  const params = await searchParams

  const pagina = Math.max(1, parseInt(params.pagina ?? '1') || 1)
  const where: Prisma.AuditoriaWhereInput = { empresaId }
  if (params.usuario) where.usuarioId = params.usuario
  if (params.entidad) where.entidad = params.entidad
  if (params.accion) where.accion = params.accion
  if (params.desde || params.hasta) {
    where.creadoEn = {}
    if (params.desde) (where.creadoEn as Prisma.DateTimeFilter).gte = new Date(params.desde + 'T00:00:00')
    if (params.hasta) (where.creadoEn as Prisma.DateTimeFilter).lte = new Date(params.hasta + 'T23:59:59.999')
  }

  const [total, registros, usuarios, puedeExportar] = await Promise.all([
    prisma.auditoria.count({ where }),
    prisma.auditoria.findMany({
      where,
      include: { usuario: { select: { id: true, nombre: true, email: true } } },
      orderBy: { creadoEn: 'desc' },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.usuario.findMany({
      where: { empresaId },
      select: { id: true, nombre: true, email: true },
      orderBy: { nombre: 'asc' },
    }),
    tienePermiso('EXPORTAR_REPORTES'),
  ])

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  // URL base para links de paginacion (preserva filtros)
  const urlPagina = (p: number) => {
    const qp = new URLSearchParams()
    if (params.usuario) qp.set('usuario', params.usuario)
    if (params.entidad) qp.set('entidad', params.entidad)
    if (params.accion) qp.set('accion', params.accion)
    if (params.desde) qp.set('desde', params.desde)
    if (params.hasta) qp.set('hasta', params.hasta)
    if (p > 1) qp.set('pagina', String(p))
    const qs = qp.toString()
    return qs ? `/auditoria?${qs}` : '/auditoria'
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Auditoría</h1>
            <p className="text-sm text-gray-500 mt-1">
              Registro de acciones realizadas en el sistema. Solo lectura.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center text-sm self-start"
          >
            ← Volver a panel
          </Link>
        </div>

        <FiltrosAuditoria usuarios={usuarios} permiteExportar={puedeExportar} />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b text-sm text-gray-600 flex justify-between items-center">
            <span>
              Total: <strong>{total}</strong> registros
            </span>
            <span>
              Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
            </span>
          </div>

          {registros.length > 0 ? (
            <>
              {/* Vista escritorio */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registros.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatearFechaHora(r.creadoEn)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {r.usuario ? (
                            <>
                              <div className="font-medium">{r.usuario.nombre}</div>
                              <div className="text-xs text-gray-500">@{r.usuario.email}</div>
                            </>
                          ) : (
                            <span className="text-gray-400 italic">(usuario eliminado)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              CLASES_ACCION[r.accion] ?? 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {r.accion}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.entidad}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{r.entidadId ?? '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">{r.ip ?? '—'}</td>
                        <td className="px-4 py-3 text-sm">
                          <DetalleAuditoria registro={{ accion: r.accion, entidad: r.entidad, entidadId: r.entidadId, datos: r.datos }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div className="lg:hidden divide-y divide-gray-200">
                {registros.map((r) => (
                  <div key={r.id} className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {r.usuario?.nombre ?? <span className="italic text-gray-400">(eliminado)</span>}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatearFechaHora(r.creadoEn)}
                          {r.ip && <> · {r.ip}</>}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          CLASES_ACCION[r.accion] ?? 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {r.accion}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {r.entidad}{r.entidadId !== null && r.entidadId !== undefined ? ` #${r.entidadId}` : ''}
                    </div>
                    <div className="mt-2">
                      <DetalleAuditoria registro={{ accion: r.accion, entidad: r.entidad, entidadId: r.entidadId, datos: r.datos }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No hay registros que coincidan con los filtros.
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between text-sm">
              {pagina > 1 ? (
                <Link href={urlPagina(pagina - 1)} className="text-blue-600 hover:underline">
                  ← Anterior
                </Link>
              ) : <span className="text-gray-300">← Anterior</span>}
              <span className="text-gray-600">
                Página {pagina} / {totalPaginas}
              </span>
              {pagina < totalPaginas ? (
                <Link href={urlPagina(pagina + 1)} className="text-blue-600 hover:underline">
                  Siguiente →
                </Link>
              ) : <span className="text-gray-300">Siguiente →</span>}
            </div>
          )}
        </div>
      </div>
    </LayoutProtegido>
  )
}
