import { NextRequest, NextResponse } from 'next/server'

// Rate limiting en memoria para el endpoint de login.
// Limita a MAX_INTENTOS intentos por IP en una ventana de VENTANA_MS ms.
//
// NOTA: En un despliegue con múltiples workers (Vercel Serverless) el estado
// en Map no se comparte entre instancias. Para producción con alta concurrencia
// se recomienda migrar a @upstash/ratelimit + Redis. Para una instancia única
// (Docker, VPS) o tráfico moderado, esta implementación es suficiente.

const intentosFallidos = new Map<string, { count: number; resetAt: number }>()

const MAX_INTENTOS = 5
const VENTANA_MS = 60 * 1000 // 1 minuto

export function middleware(request: NextRequest) {
  // Aplicar rate limiting solo al endpoint de credenciales de NextAuth.
  if (
    request.nextUrl.pathname === '/api/auth/callback/credentials' &&
    request.method === 'POST'
  ) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const ahora = Date.now()
    const registro = intentosFallidos.get(ip)

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
      intentosFallidos.set(ip, registro)
    } else {
      // Ventana nueva o expirada: reiniciar contador.
      intentosFallidos.set(ip, { count: 1, resetAt: ahora + VENTANA_MS })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/callback/credentials'],
}
