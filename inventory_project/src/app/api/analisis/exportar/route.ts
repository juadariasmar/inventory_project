import { NextResponse } from 'next/server'
import { obtenerTodoAnalisis } from '@/lib/analisis'
import { tienePermiso } from '@/lib/permisos'

function escaparCsv(valor: string | number): string {
  const str = String(valor)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function tablaCsv(titulo: string, columnas: string[], filas: (string | number)[][]): string {
  const lineas = [
    `# ${titulo}`,
    columnas.map(escaparCsv).join(','),
    ...filas.map((f) => f.map(escaparCsv).join(',')),
    '',
  ]
  return lineas.join('\n')
}

export async function GET() {
  if (!(await tienePermiso('EXPORTAR_REPORTES'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { stockAgotarse, sinMovimientos, altaRotacion, stockCritico, resumen } =
      await obtenerTodoAnalisis()

    const secciones: string[] = []

    secciones.push(
      tablaCsv(
        'Stock por agotarse',
        ['Producto', 'Código', 'Cantidad actual', 'Consumo diario promedio', 'Días para agotarse'],
        stockAgotarse.map((a) => [
          a.nombre,
          a.codigo,
          a.cantidadActual,
          a.consumoDiarioPromedio,
          a.diasParaAgotarse,
        ])
      )
    )

    secciones.push(
      tablaCsv(
        'Productos sin movimientos',
        ['Producto', 'Código', 'Cantidad actual', 'Días sin movimiento', 'Valor inmovilizado'],
        sinMovimientos.map((a) => [
          a.nombre,
          a.codigo,
          a.cantidadActual,
          a.diasSinMovimiento,
          a.valorInmovilizado,
        ])
      )
    )

    secciones.push(
      tablaCsv(
        'Productos con alta rotación (últimos 30 días)',
        ['Producto', 'Código', 'Salidas registradas', 'Unidades vendidas'],
        altaRotacion.map((a) => [a.nombre, a.codigo, a.totalSalidas, a.cantidadVendida])
      )
    )

    secciones.push(
      tablaCsv(
        'Stock crítico',
        ['Producto', 'Código', 'Cantidad actual', 'Stock mínimo', 'Faltante para 2x mínimo'],
        stockCritico.map((a) => [
          a.nombre,
          a.codigo,
          a.cantidadActual,
          a.stockMinimo,
          a.faltanteParaDuplicarMinimo,
        ])
      )
    )

    secciones.push(
      tablaCsv(
        'Movimientos diarios (últimos 30 días)',
        ['Fecha', 'Entradas', 'Salidas'],
        resumen.map((r) => [r.fecha, r.entradas, r.salidas])
      )
    )

    const csv = '﻿' + secciones.join('\n')
    const fecha = new Date().toISOString().slice(0, 10)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analisis_inventario_${fecha}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error al exportar análisis:', error)
    return NextResponse.json({ error: 'Error al exportar análisis' }, { status: 500 })
  }
}
