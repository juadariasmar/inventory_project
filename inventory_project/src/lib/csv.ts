// Parseo simple de CSV con soporte para campos entrecomillados y comas dentro.
// Sin librerias externas. Devuelve cabecera + filas como objetos por nombre de columna.

export interface ResultadoCsv {
  encabezados: string[]
  filas: Record<string, string>[]
}

function parsearLinea(linea: string): string[] {
  const campos: string[] = []
  let actual = ''
  let dentroComillas = false
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (dentroComillas) {
      if (c === '"') {
        if (linea[i + 1] === '"') {
          actual += '"'
          i++
        } else {
          dentroComillas = false
        }
      } else {
        actual += c
      }
    } else {
      if (c === ',') {
        campos.push(actual)
        actual = ''
      } else if (c === '"' && actual === '') {
        dentroComillas = true
      } else {
        actual += c
      }
    }
  }
  campos.push(actual)
  return campos.map((x) => limpiarComillasEnvolventes(x.trim()))
}

/**
 * Si el valor llega envuelto en comillas dobles (con o sin espacios al rededor),
 * devuelve solo el contenido. Mantiene el valor original si las comillas son
 * desbalanceadas o si forman parte del contenido real.
 *
 * Ejemplos:
 *   "Producto X"   -> Producto X
 *   "  Producto "  -> Producto
 *   '"15,000"'     -> 15,000
 *   sin comillas   -> sin comillas
 *   "rota          -> "rota  (no se toca)
 */
function limpiarComillasEnvolventes(valor: string): string {
  if (valor.length >= 2 && valor.startsWith('"') && valor.endsWith('"')) {
    return valor.slice(1, -1).replace(/""/g, '"').trim()
  }
  return valor
}

export function parsearCsv(texto: string): ResultadoCsv {
  // Quitar BOM si lo hay y normalizar saltos de linea
  const sin_bom = texto.replace(/^﻿/, '')
  const lineas = sin_bom.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lineas.length === 0) return { encabezados: [], filas: [] }
  const encabezados = parsearLinea(lineas[0]).map((h) => h.toLowerCase())
  const filas: Record<string, string>[] = []
  for (let i = 1; i < lineas.length; i++) {
    const campos = parsearLinea(lineas[i])
    const fila: Record<string, string> = {}
    encabezados.forEach((h, j) => {
      fila[h] = campos[j] ?? ''
    })
    filas.push(fila)
  }
  return { encabezados, filas }
}
