// Helpers para sugerir codigos consecutivos y prefijos de categoria.

import { prisma } from './db'

const ANCHO = 5

/**
 * Devuelve un prefijo sugerido para una categoria nueva.
 * - Toma las primeras 3 letras del nombre normalizado (sin acentos,
 *   sin caracteres no alfanumericos, en mayusculas).
 * - Si esa combinacion ya esta en uso por otro prefijo, agrega la
 *   siguiente letra del nombre.
 * - Si el nombre no tiene mas letras o seguimos en colision, usa un
 *   sufijo numerico (BEB1, BEB2, etc.).
 * - Si el nombre es vacio o no tiene letras, usa 'CAT' como base.
 */
export function generarPrefijoSugerido(
  nombre: string,
  prefijosEnUso: Set<string>,
): string {
  const limpio = normalizarParaPrefijo(nombre)
  const base = limpio.length > 0 ? limpio : 'CAT'
  let intento = 0
  let candidato = base.slice(0, 3) || 'CAT'

  while (prefijosEnUso.has(candidato)) {
    intento++
    if (3 + intento <= base.length) {
      candidato = base.slice(0, 3 + intento)
    } else {
      candidato = `${base.slice(0, 3) || 'CAT'}${intento}`
    }
    if (intento > 1000) break
  }
  return candidato
}

function normalizarParaPrefijo(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

/**
 * Genera el siguiente codigo consecutivo para una categoria dada.
 * Formato: `${prefijo}-NNNNN` (5 digitos zero-padded).
 *
 * Mira los codigos existentes que respetan el patron del prefijo de
 * la categoria, encuentra el numero mas alto y devuelve el siguiente
 * libre.
 */
export async function siguienteCodigoConsecutivoPorCategoria(
  categoriaId: number,
  empresaId: string
): Promise<string> {
  if (!empresaId) throw new Error('empresaId es requerido')
  const categoria = await prisma.categoria.findUnique({
    where: { id: categoriaId },
    select: { prefijo: true, empresaId: true },
  })
  if (!categoria || categoria.empresaId !== empresaId) {
    throw new Error('Categoría no encontrada o no pertenece a la empresa')
  }
  const prefijo = categoria.prefijo
  const productos = await prisma.producto.findMany({
    where: { categoriaId, empresaId },
    select: { codigo: true },
  })
  const patron = new RegExp(`^${escapeRegex(prefijo)}-(\\d+)$`)
  let max = 0
  const usados = new Set<string>()
  for (const p of productos) {
    usados.add(p.codigo)
    const m = patron.exec(p.codigo)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > max) max = n
    }
  }
  let n = max + 1
  let candidato = `${prefijo}-${String(n).padStart(ANCHO, '0')}`
  while (usados.has(candidato)) {
    n++
    candidato = `${prefijo}-${String(n).padStart(ANCHO, '0')}`
  }
  return candidato
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}


// Fallback global (sin categoria). Mantenido por compatibilidad pero no
// deberia llamarse ahora que la categoria es obligatoria.
export async function siguienteCodigoConsecutivo(empresaId: string): Promise<string> {
  if (!empresaId) throw new Error('empresaId es requerido')
  const productos = await prisma.producto.findMany({ where: { empresaId }, select: { codigo: true } })
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
