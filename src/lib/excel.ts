// Helpers para generar libros Excel (.xlsx) bien formateados.
// Centraliza estilos para que todos los exportables del sistema se vean igual.

import ExcelJS from 'exceljs'

const COLOR_ENCABEZADO = 'FF0F2449'  // azul oscuro institucional
const COLOR_BLANCO = 'FFFFFFFF'
const COLOR_GRIS_TENUE = 'FFF5F6F8'

export interface ColumnaExcel {
  encabezado: string
  // Identificador del dato en la fila (cuando filas viene como objetos).
  key?: string
  // Ancho fijo de la columna (opcional, si no se autoajusta a partir del contenido).
  ancho?: number
  // Formato de numero estilo Excel (ej: '$#,##0', '0.00', 'dd/mm/yyyy hh:mm').
  formato?: string
  // Alineacion horizontal del valor.
  alineacion?: 'left' | 'center' | 'right'
}

export interface DefHoja {
  nombre: string
  titulo?: string
  subtitulo?: string
  columnas: ColumnaExcel[]
  // Datos: arreglo de objetos cuyas claves coinciden con `columnas[].key`.
  filas: Record<string, unknown>[]
  // Mensaje si filas esta vacio.
  mensajeVacio?: string
}

function autoAnchoPorContenido(filas: Record<string, unknown>[], columna: ColumnaExcel): number {
  const enValor = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    if (v instanceof Date) return v.toLocaleString('es-MX')
    return String(v)
  }
  let maxLen = columna.encabezado.length
  if (columna.key) {
    for (const f of filas) {
      const v = enValor(f[columna.key])
      if (v.length > maxLen) maxLen = v.length
    }
  }
  // Margen + clamp a un ancho razonable
  return Math.min(60, Math.max(10, maxLen + 2))
}


/**
 * Construye una hoja con titulo, subtitulo, encabezado con estilo,
 * filas con formato por columna, y filtro automatico en los encabezados.
 */
function agregarHoja(libro: ExcelJS.Workbook, def: DefHoja): void {
  const ws = libro.addWorksheet(def.nombre, {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  const totalCols = def.columnas.length

  let filaActual = 1

  // Titulo en cabecera
  if (def.titulo) {
    ws.mergeCells(filaActual, 1, filaActual, totalCols)
    const cTitulo = ws.getCell(filaActual, 1)
    cTitulo.value = def.titulo
    cTitulo.font = { name: 'Arial', size: 14, bold: true, color: { argb: COLOR_ENCABEZADO } }
    cTitulo.alignment = { horizontal: 'left', vertical: 'middle' }
    ws.getRow(filaActual).height = 22
    filaActual++
  }

  if (def.subtitulo) {
    ws.mergeCells(filaActual, 1, filaActual, totalCols)
    const cSub = ws.getCell(filaActual, 1)
    cSub.value = def.subtitulo
    cSub.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF6B7280' } }
    cSub.alignment = { horizontal: 'left', vertical: 'middle' }
    filaActual++
  }

  if (def.titulo || def.subtitulo) {
    filaActual++ // fila vacia de separacion
  }

  // Encabezados
  const filaEncab = ws.getRow(filaActual)
  def.columnas.forEach((col, i) => {
    const celda = filaEncab.getCell(i + 1)
    celda.value = col.encabezado
    celda.font = { name: 'Arial', size: 11, bold: true, color: { argb: COLOR_BLANCO } }
    celda.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_ENCABEZADO },
    }
    celda.alignment = { horizontal: 'center', vertical: 'middle' }
    celda.border = {
      top: { style: 'thin', color: { argb: COLOR_ENCABEZADO } },
      bottom: { style: 'thin', color: { argb: COLOR_ENCABEZADO } },
    }
  })
  filaEncab.height = 20

  // Anchos de columna
  def.columnas.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.ancho ?? autoAnchoPorContenido(def.filas, col)
  })

  filaActual++

  // Filas
  if (def.filas.length === 0) {
    ws.mergeCells(filaActual, 1, filaActual, totalCols)
    const c = ws.getCell(filaActual, 1)
    c.value = def.mensajeVacio ?? 'Sin datos.'
    c.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF6B7280' } }
    c.alignment = { horizontal: 'center', vertical: 'middle' }
  } else {
    def.filas.forEach((fila, indiceFila) => {
      const r = ws.getRow(filaActual + indiceFila)
      def.columnas.forEach((col, i) => {
        const celda = r.getCell(i + 1)
        const valor = col.key ? fila[col.key] : undefined
        celda.value = (valor as ExcelJS.CellValue) ?? null
        celda.font = { name: 'Arial', size: 10 }
        if (col.alineacion) {
          celda.alignment = { horizontal: col.alineacion, vertical: 'middle' }
        } else {
          celda.alignment = { vertical: 'middle' }
        }
        if (col.formato) {
          celda.numFmt = col.formato
        }
      })
      // Cebra para legibilidad
      if (indiceFila % 2 === 1) {
        r.eachCell((c) => {
          c.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLOR_GRIS_TENUE },
          }
        })
      }
    })
  }

  // Filtros automaticos sobre los encabezados (no incluye titulo)
  if (def.filas.length > 0) {
    const ultimaFila = filaActual + def.filas.length - 1
    ws.autoFilter = {
      from: { row: filaActual - 1, column: 1 },
      to: { row: ultimaFila, column: totalCols },
    }
  }
}


export interface DefLibro {
  titulo: string
  subtitulo?: string
  autor?: string
  hojas: DefHoja[]
}


/**
 * Construye un libro ExcelJS con varias hojas formateadas y devuelve su buffer.
 */
export async function generarLibroExcel(def: DefLibro): Promise<Buffer> {
  const libro = new ExcelJS.Workbook()
  libro.creator = def.autor ?? 'Sistema de Inventario'
  libro.created = new Date()
  libro.title = def.titulo
  libro.description = def.subtitulo ?? ''

  for (const hoja of def.hojas) {
    agregarHoja(libro, hoja)
  }

  const buf = await libro.xlsx.writeBuffer()
  return Buffer.from(buf as ArrayBuffer)
}


// Atajos comunes de formato Excel
export const FORMATO_MONEDA = '"$"#,##0'
export const FORMATO_DECIMAL_2 = '0.00'
export const FORMATO_FECHA_HORA = 'dd/mm/yyyy hh:mm'
export const FORMATO_FECHA = 'dd/mm/yyyy'
