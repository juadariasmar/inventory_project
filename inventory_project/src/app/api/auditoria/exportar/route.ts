import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { formatearFechaHora } from '@/lib/fechas'
import type { Prisma } from '@prisma/client'

function escapeCsv(valor: string): string {
  if (valor.includes('"') || valor.includes(',') || valor.includes('\n')) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  if (!(await tienePermiso('EXPORTAR_REPORTES'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const sp = request.nextUrl.searchParams
  const where: Prisma.AuditoriaWhereInput = {}
  if (sp.get('usuario')) where.usuarioId = parseInt(sp.get('usuario')!)
  if (sp.get('entidad')) where.entidad = sp.get('entidad')!
  if (sp.get('accion')) where.accion = sp.get('accion')!
  if (sp.get('desde') || sp.get('hasta')) {
    where.creadoEn = {}
    if (sp.get('desde')) (where.creadoEn as Prisma.DateTimeFilter).gte = new Date(sp.get('desde')! + 'T00:00:00')
    if (sp.get('hasta')) (where.creadoEn as Prisma.DateTimeFilter).lte = new Date(sp.get('hasta')! + 'T23:59:59.999')
  }

  const registros = await prisma.auditoria.findMany({
    where,
    include: { usuario: { select: { nombre: true, nombreUsuario: true } } },
    orderBy: { creadoEn: 'desc' },
  })

  const filas: string[] = []
  filas.push(['Fecha', 'Usuario', 'NombreUsuario', 'Accion', 'Entidad', 'EntidadId', 'IP', 'Datos'].join(','))
  for (const r of registros) {
    filas.push([
      escapeCsv(formatearFechaHora(r.creadoEn)),
      escapeCsv(r.usuario?.nombre ?? '(eliminado)'),
      escapeCsv(r.usuario?.nombreUsuario ?? ''),
      escapeCsv(r.accion),
      escapeCsv(r.entidad),
      escapeCsv(r.entidadId?.toString() ?? ''),
      escapeCsv(r.ip ?? ''),
      escapeCsv(r.datos ? JSON.stringify(r.datos) : ''),
    ].join(','))
  }

  const csv = '﻿' + filas.join('\n')  // BOM para que Excel detecte UTF-8
  const fecha = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="auditoria-${fecha}.csv"`,
    },
  })
}
