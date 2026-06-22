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

/**
 * Algunos exportadores (Excel con ciertas configuraciones, sistemas legacy)
 * envuelven la fila ENTERA en comillas dobles y luego escapan cada comilla
 * interna como "". Ejemplo:
 *
 *   codigo,nombre,categoria
 *   "WH001,""Gasas 10x10"",Vendajes"
 *
 * Sin desempaquetar, el parser ve la primera comilla y se traga toda la
 * fila como un solo campo. Aqui detectamos y desempaquetamos antes.
 *
 * Heuristica: la linea empieza y termina con `"`, y contiene `""` (escape
 * de comilla doble dentro). Eso descarta casos legitimos como una sola
 * columna con un solo valor entrecomillado.
 */
function desempaquetarFilaSiEnvuelta(linea: string): string {
  if (
    linea.length >= 4 &&
    linea.startsWith('"') &&
    linea.endsWith('"') &&
    linea.includes('""')
  ) {
    return linea.slice(1, -1).replace(/""/g, '"')
  }
  return linea
}

export function parsearCsv(texto: string): ResultadoCsv {
  // Quitar BOM si lo hay y normalizar saltos de linea
  const sin_bom = texto.replace(/^﻿/, '')
  const lineas = sin_bom.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lineas.length === 0) return { encabezados: [], filas: [] }
  const encabezados = parsearLinea(lineas[0]).map((h) => h.toLowerCase())
  const filas: Record<string, string>[] = []
  for (let i = 1; i < lineas.length; i++) {
    const linea = desempaquetarFilaSiEnvuelta(lineas[i])
    const campos = parsearLinea(linea)
    const fila: Record<string, string> = {}
    encabezados.forEach((h, j) => {
      fila[h] = campos[j] ?? ''
    })
    filas.push(fila)
  }
  return { encabezados, filas }
}
