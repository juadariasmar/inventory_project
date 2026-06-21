import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || ''

const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)

const prismaGlobal = global as unknown as { prisma: PrismaClient }

export const prisma =
  prismaGlobal.prisma ||
  new PrismaClient({ adapter, log: ['error'] })

if (process.env.NODE_ENV !== 'production') prismaGlobal.prisma = prisma
