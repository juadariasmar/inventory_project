import { createNeonAuth } from '@neondatabase/auth/next/server'

/**
 * Resuelve y valida los secretos de Neon Auth.
 * En producción FALLA CERRADO: lanza si faltan baseUrl o cookie secret.
 * Fuera de producción usa fallbacks para no romper el build local.
 */
export function resolveAuthSecrets(env: NodeJS.ProcessEnv = process.env) {
  const isProd = env.NODE_ENV === 'production'
  const baseUrl = env.NEON_AUTH_BASE_URL
  const cookieSecret = env.NEON_AUTH_COOKIE_SECRET

  if (isProd && (!baseUrl || !cookieSecret)) {
    throw new Error(
      'NEON_AUTH_BASE_URL y NEON_AUTH_COOKIE_SECRET son obligatorios en producción'
    )
  }

  return {
    baseUrl: baseUrl || 'https://placeholder-neon-auth.neon.tech',
    cookieSecret: cookieSecret || 'secret-for-build-only-change-in-prod',
  }
}

const { baseUrl, cookieSecret } = resolveAuthSecrets()

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sameSite: 'lax',
  },
})
