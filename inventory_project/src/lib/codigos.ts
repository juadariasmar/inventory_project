// Sugerencia de codigo consecutivo para productos nuevos.
// El sistema permite cualquier codigo unico (alfanumerico), pero para reducir
// errores manuales se sugiere por defecto el siguiente numero consecutivo
// rellenado a 5 digitos.

import { prisma } from './db'

const ANCHO = 5

/**
 * Devuelve el siguiente codigo consecutivo disponible (no en uso).
 * Considera los codigos existentes que son puramente numericos (con o sin
 * ceros a la izquierda). Los codigos alfanumericos como "LAP-001" se ignoran
 * para no chocar con un patron arbitrario.
 *
 * Si ya hay productos numerados hasta 00042, devuelve "00043".
 * Si no hay ninguno, devuelve "00001".
 *
 * Hace un check rapido para evitar colisiones puntuales: si el sugerido ya
 * existe, busca el siguiente libre.
 */
export async function siguienteCodigoConsecutivo(): Promise<string> {
  const productos = await prisma.producto.findMany({ select: { codigo: true } })
  let max = 0
  const usados = new Set<string>()
  for (const p of productos) {
    usados.add(p.codigo)
    if (/^\d+$/.test(p.codigo)) {
      const n = parseInt(p.codigo, 10)
      if (n > max) max = n
    }
  }
  let n = max + 1
  let candidato = String(n).padStart(ANCHO, '0')
  while (usados.has(candidato)) {
    n++
    candidato = String(n).padStart(ANCHO, '0')
  }
  return candidato
}
