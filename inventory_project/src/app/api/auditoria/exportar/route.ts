import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { describirAuditoria } from '@/lib/auditoriaDescripcion'
import { FORMATO_FECHA_HORA, generarLibroExcel } from '@/lib/excel'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }
  if (!(await tienePermiso('EXPORTAR_REPORTES'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const sp = request.nextUrl.searchParams
  const where: Prisma.AuditoriaWhereInput = { empresaId }
  if (sp.get('usuario')) where.usuarioId = sp.get('usuario')!
  if (sp.get('entidad')) where.entidad = sp.get('entidad')!
  if (sp.get('accion')) where.accion = sp.get('accion')!
  if (sp.get('desde') || sp.get('hasta')) {
    where.creadoEn = {}
    if (sp.get('desde')) (where.creadoEn as Prisma.DateTimeFilter).gte = new Date(sp.get('desde')! + 'T00:00:00')
    if (sp.get('hasta')) (where.creadoEn as Prisma.DateTimeFilter).lte = new Date(sp.get('hasta')! + 'T23:59:59.999')
  }

  const registros = await prisma.auditoria.findMany({
    where,
    include: { usuario: { select: { nombre: true, email: true } } },
    orderBy: { creadoEn: 'desc' },
  })

  const ahora = new Date()
  const stampCo = ahora
    .toLocaleString('sv-SE', { timeZone: 'America/Bogota', hour12: false })
    .replace(/[-: ]/g, '')
    .slice(0, 14)
  const nombreArchivo = `auditoria_${stampCo.slice(0, 8)}_${stampCo.slice(8)}.xlsx`
  const fechaCo = ahora.toLocaleString('es-MX', { timeZone: 'America/Bogota' })

  const filtrosTexto: string[] = []
  if (sp.get('usuario')) filtrosTexto.push(`usuario #${sp.get('usuario')}`)
  if (sp.get('entidad')) filtrosTexto.push(`entidad ${sp.get('entidad')}`)
  if (sp.get('accion')) filtrosTexto.push(`acción ${sp.get('accion')}`)
  if (sp.get('desde')) filtrosTexto.push(`desde ${sp.get('desde')}`)
  if (sp.get('hasta')) filtrosTexto.push(`hasta ${sp.get('hasta')}`)
  const subtituloFiltros =
    filtrosTexto.length > 0
      ? `Filtros: ${filtrosTexto.join(', ')}.`
      : 'Sin filtros aplicados (todos los registros).'

  const buffer = await generarLibroExcel({
    titulo: 'Auditoría del sistema',
    subtitulo: 'Sistema de Inventario',
    autor: sesion.user.name ?? 'Sistema de Inventario',
    hojas: [
      {
        nombre: 'Auditoría',
        titulo: 'Registro de auditoría',
        subtitulo: `Generado el ${fechaCo} por ${sesion.user.name ?? 'Sistema'}. ${subtituloFiltros}`,
        columnas: [
          { encabezado: 'Fecha y hora', key: 'fecha', ancho: 20, formato: FORMATO_FECHA_HORA },
          { encabezado: 'Usuario', key: 'usuario', ancho: 26 },
          { encabezado: 'Login', key: 'login', ancho: 16 },
          { encabezado: 'Acción', key: 'accion', ancho: 16 },
          { encabezado: 'Entidad', key: 'entidad', ancho: 14 },
          { encabezado: 'ID', key: 'entidadId', ancho: 8, alineacion: 'right' },
          { encabezado: 'IP', key: 'ip', ancho: 18 },
          { encabezado: 'Descripción', key: 'descripcion', ancho: 80 },
        ],
        filas: registros.map((r) => ({
          fecha: r.creadoEn,
          usuario: r.usuario?.nombre ?? '(eliminado)',
          login: r.usuario?.email ?? '',
          accion: r.accion,
          entidad: r.entidad,
          entidadId: r.entidadId ?? '',
          ip: r.ip ?? '',
          descripcion: describirAuditoria({
            accion: r.accion,
            entidad: r.entidad,
            entidadId: r.entidadId,
            datos: r.datos,
          }),
        })),
        mensajeVacio: 'No hay registros que coincidan con los filtros.',
      },
    ],
  })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Cache-Control': 'no-store',
    },
  })
}
