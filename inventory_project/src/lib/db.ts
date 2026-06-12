import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

let prisma: PrismaClient

// Usar cliente Prisma estándar con DATABASE_URL de Neon
// Neon proporciona una connection string compatible con PostgreSQL estándar
prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { prisma }
