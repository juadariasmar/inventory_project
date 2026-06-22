import { NextResponse } from 'next/server'
import { esAdmin } from '@/lib/permisos'

export async function GET() {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const filas = [
    'codigo,nombre,descripcion,precio,cantidad,stockMinimo,categoria',
    'LAP-001,Lápiz HB,Caja por 12 unidades,5000,100,20,Oficina',
    'PAPEL-001,Resma carta,75 gr 500 hojas,15000,50,10,Oficina',
    'AGUA-001,Agua mineral 600ml,Sin gas,2500,200,40,Bebidas',
  ]
  const csv = '﻿' + filas.join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla_productos.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
