// Auditoria de acciones del sistema.
// Registra quien hizo que, sobre que entidad, cuando, desde donde y con que datos.

import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'
import type { NextRequest } from 'next/server'

export type AccionAuditoria =
  | 'CREAR'
  | 'ACTUALIZAR'
  | 'ELIMINAR'
  | 'LOGIN'
  | 'LOGIN_FALLIDO'

export type EntidadAuditoria =
  | 'Producto'
  | 'Categoria'
  | 'Movimiento'
  | 'Usuario'
  | 'Venta'
  | 'Cotizacion'
  | 'Sesion'

export const ACCIONES: AccionAuditoria[] = [
  'CREAR',
  'ACTUALIZAR',
  'ELIMINAR',
  'LOGIN',
  'LOGIN_FALLIDO',
]

export const ENTIDADES: EntidadAuditoria[] = [
  'Producto',
  'Categoria',
  'Movimiento',
  'Usuario',
  'Venta',
  'Cotizacion',
  'Sesion',
]

interface ParametrosAuditoria {
  accion: AccionAuditoria
  entidad: EntidadAuditoria
  entidadId?: number | string | null
  datos?: unknown
  // Si se conoce el usuario (p. ej. en LOGIN antes de la sesion), se pasa aqui.
  // Si no se pasa, se intenta obtener de la sesion actual.
  usuarioId?: string | null
  ip?: string | null
}

export async function registrarAuditoria(params: ParametrosAuditoria): Promise<void> {
  try {
    let usuarioId: string | null | undefined = params.usuarioId
    if (usuarioId === undefined) {
      const sesion = await obtenerSesion()
      const idVal = sesion?.user?.id
      usuarioId = typeof idVal === 'string' ? idVal : (idVal ? String(idVal) : null)
    }
    await prisma.auditoria.create({
      data: {
        usuarioId: usuarioId ?? null,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId != null ? String(params.entidadId) : null,
        // Prisma JsonValue acepta cualquier objeto serializable
        datos: (params.datos as object | null | undefined) ?? undefined,
        ip: params.ip ?? null,
      },
    })
  } catch (err) {
    // No queremos que un fallo de auditoria rompa la operacion principal.
    console.error('Error registrando auditoria:', err)
  }
}

export function extraerIp(request: NextRequest | Request): string | null {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  return real || null
}
