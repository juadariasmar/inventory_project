/**
 * Determina si un correo está en la lista de administradores (env ADMIN_EMAILS,
 * separada por comas). Permite designar administradores sin editar la base de datos.
 */
export function esEmailAdministrador(email: string | null | undefined): boolean {
  if (!email) return false
  const lista = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return lista.includes(email.toLowerCase())
}
