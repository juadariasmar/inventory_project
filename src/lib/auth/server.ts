import { createNeonAuth } from '@neondatabase/auth/next/server'

/**
 * Resuelve y valida los secretos de Neon Auth.
 * En producción y en TIEMPO DE EJECUCIÓN falla cerrado: lanza si faltan baseUrl
 * o cookie secret. Durante el build de Next.js (NEXT_PHASE === 'phase-production-build')
 * y fuera de producción usa fallbacks para no romper la compilación.
 */
export function resolveAuthSecrets(env: NodeJS.ProcessEnv = process.env) {
  const isProd = env.NODE_ENV === 'production'
  const isBuildPhase = env.NEXT_PHASE === 'phase-production-build'
  const baseUrl = env.NEON_AUTH_BASE_URL
  const cookieSecret = env.NEON_AUTH_COOKIE_SECRET

  if (isProd && !isBuildPhase && (!baseUrl || !cookieSecret)) {
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
