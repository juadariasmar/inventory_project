import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import WebSocket from 'ws'

const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

let prisma: PrismaClient

// Usar el adaptador Neon SOLO si está explícitamente habilitado.
// Esto evita errores en entornos locales donde el adaptador o WebSocket
// no están correctamente configurados.
const useNeonAdapter = process.env.USE_NEON_ADAPTER === 'true'

if (useNeonAdapter) {
  try {
    // Configurar el constructor de WebSocket para que Neon pooler funcione
    // WebSocket es un módulo CommonJS, asegurar que se pasa la clase correctamente
    if (WebSocket && typeof WebSocket === 'function') {
      neonConfig.webSocketConstructor = WebSocket as any
    } else if (WebSocket && typeof WebSocket.default === 'function') {
      neonConfig.webSocketConstructor = WebSocket.default as any
    } else {
      throw new Error('[db] WebSocket constructor not available')
    }

    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)

    prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  } catch (err) {
    // Si falla la inicialización del adaptador, abortar el arranque
    // en entornos de producción para evitar correr con una configuración desconocida.
    // En desarrollo, hacemos fallback para facilitar pruebas locales.
    // eslint-disable-next-line no-console
    console.error('[db] Neon adapter init failed:', err)
    if (process.env.NODE_ENV === 'production') {
      throw err
    }

    // Fallback en desarrollo
    // eslint-disable-next-line no-console
    console.warn('[db] Falling back to default PrismaClient for local development')
    prisma = globalForPrisma.prisma ?? new PrismaClient()
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  }
} else {
  // Sin adaptador: usar cliente Prisma estándar
  prisma = globalForPrisma.prisma ?? new PrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
}

export { prisma }
