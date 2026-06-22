// Mapeo flexible de encabezados de columnas a los campos canonicos del sistema.
// Permite cargar archivos con cualquier nomenclatura razonable, en cualquier
// orden, e ignorar columnas extra que no aporten.

/**
 * Normaliza un nombre de columna para comparacion: quita acentos, pasa a
 * minusculas, colapsa espacios y guiones bajos. "Stock Mínimo " -> "stockminimo".
 */
export function normalizarEncabezado(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar acentos combinantes (unicode combining marks)
    .toLowerCase()
    .replace(/[_\s\-./]+/g, '')
    .trim()
}

/**
 * Campos canonicos que el sistema espera para crear productos, con sus
 * alias mas comunes ya normalizados.
 */
export const ALIASES_PRODUCTO: Record<string, string[]> = {
  codigo:      ['codigo', 'cod', 'sku', 'referencia', 'ref', 'idproducto', 'codigoproducto', 'codigobarra', 'codigobarras'],
  nombre:      ['nombre', 'producto', 'nombreproducto', 'descripcionproducto', 'item', 'articulo'],
  descripcion: ['descripcion', 'observacion', 'observaciones', 'detalle', 'detalles', 'notas'],
  precio:      ['precio', 'precioventa', 'preciounitario', 'valor', 'valorunitario', 'valorventa', 'pvp'],
  cantidad:    ['cantidad', 'stock', 'existencia', 'existencias', 'cantidadinicial', 'stockinicial', 'unidades', 'inventario'],
  stockMinimo: ['stockminimo', 'minimo', 'alerta', 'umbral', 'cantidadminima', 'minimoinventario'],
  categoria:   ['categoria', 'cat', 'tipo', 'grupo', 'familia', 'rubro'],
}


export interface ResultadoMapeo {
  // Mapa campo canonico -> nombre real de la columna en el archivo.
  mapeo: Record<string, string>
  // Columnas del archivo que no se reconocieron y se ignoraran.
  ignoradas: string[]
  // Campos canonicos que no se encontraron en el archivo.
  faltantes: string[]
}


/**
 * Recibe los encabezados originales del archivo y devuelve a que campo canonico
 * corresponde cada uno, segun los aliases. Las columnas que no se reconocen se
 * listan como `ignoradas`.
 */
export function mapearColumnas(
  encabezadosOriginales: string[],
  camposRequeridos: string[] = ['codigo', 'nombre', 'precio'],
): ResultadoMapeo {
  const mapeo: Record<string, string> = {}
  const ignoradas: string[] = []
  const usadas = new Set<string>()

  // Para cada campo canonico, buscar el primer encabezado del archivo que
  // (una vez normalizado) corresponda a alguno de sus aliases.
  for (const [campo, aliases] of Object.entries(ALIASES_PRODUCTO)) {
    for (const encab of encabezadosOriginales) {
      if (usadas.has(encab)) continue
      const normalizado = normalizarEncabezado(encab)
      if (aliases.includes(normalizado)) {
        mapeo[campo] = encab
        usadas.add(encab)
        break
      }
    }
  }

  for (const encab of encabezadosOriginales) {
    if (!usadas.has(encab) && encab.trim() !== '') ignoradas.push(encab)
  }

  const faltantes = camposRequeridos.filter((c) => !mapeo[c])

  return { mapeo, ignoradas, faltantes }
}


/**
 * Aplica un mapeo a una fila (objeto encabezado-original -> valor) y devuelve
 * un objeto con los campos canonicos.
 */
export function aplicarMapeo(
  fila: Record<string, string>,
  mapeo: Record<string, string>,
): Record<string, string> {
  const resultado: Record<string, string> = {}
  for (const [canonico, encabezadoOriginal] of Object.entries(mapeo)) {
    resultado[canonico] = fila[encabezadoOriginal] ?? ''
  }
  return resultado
}
