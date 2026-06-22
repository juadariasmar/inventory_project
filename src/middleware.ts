import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { auth } from '@/lib/auth/server'

// Fallback en memoria por si Upstash no está configurado (ej. desarrollo local)
const intentosFallidosFallback = new Map<string, { count: number; resetAt: number }>()
const MAX_INTENTOS = 5
const VENTANA_MS = 60 * 1000 // 1 minuto

// Inicializar Upstash solo si las credenciales existen en .env
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const ratelimit = redisUrl && redisToken ? new Ratelimit({
  redis: new Redis({ url: redisUrl, token: redisToken }),
  limiter: Ratelimit.slidingWindow(MAX_INTENTOS, '1 m'),
  analytics: true,
}) : null;

export async function middleware(request: NextRequest) {
  // Aplicar rate limiting solo al endpoint de credenciales.
  if (
    request.nextUrl.pathname.includes('/api/auth/') &&
    request.method === 'POST'
  ) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (ratelimit) {
      // Usar Upstash (Robusto para Vercel Serverless/Edge)
      const { success, reset } = await ratelimit.limit(`ratelimit_login_${ip}`)
      if (!success) {
        const ahora = Date.now()
        const retryAfter = Math.ceil((reset - ahora) / 1000)
        return NextResponse.json(
          {
            error: `Demasiados intentos de inicio de sesión. Espera ${retryAfter > 0 ? retryAfter : 60} segundos.`,
          },
          { status: 429 }
        )
      }
    } else {
      // Fallback en memoria (Local / Sin Redis configurado)
      const ahora = Date.now()
      const registro = intentosFallidosFallback.get(ip)

      if (registro && ahora < registro.resetAt) {
        if (registro.count >= MAX_INTENTOS) {
          return NextResponse.json(
            {
              error: `Demasiados intentos de inicio de sesión. Espera ${Math.ceil((registro.resetAt - ahora) / 1000)} segundos.`,
            },
            { status: 429 }
          )
        }
        registro.count++
        intentosFallidosFallback.set(ip, registro)
      } else {
        intentosFallidosFallback.set(ip, { count: 1, resetAt: ahora + VENTANA_MS })
      }
    }
  }

  return auth.middleware({ loginUrl: '/auth/sign-in' })(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> Ya cubierto por rate limiting arriba, pero los callbacks pasan
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/ (public auth routes like /auth/sign-in, /auth/reset-password)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/).*)',
  ],
}
