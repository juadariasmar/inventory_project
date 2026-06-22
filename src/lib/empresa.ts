import { prisma } from './db'
import { AppError } from './AppError'

/**
 * Devuelve el id de la empresa por defecto (la primera registrada).
 * Se usa para asignar empresa a usuarios creados fuera de un contexto de sesión
 * (webhook de Neon Auth, fallback de obtenerSesion). En despliegues single-tenant
 * existe una única "Empresa Principal" creada por el seed.
 */
export async function obtenerEmpresaPorDefectoId(): Promise<string> {
  const empresa = await prisma.empresa.findFirst({ orderBy: { creadoEn: 'asc' } })
  if (!empresa) {
    throw new AppError('No hay ninguna empresa configurada en el sistema', 500)
  }
  return empresa.id
}
