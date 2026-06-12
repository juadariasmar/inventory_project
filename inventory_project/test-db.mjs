import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const result = await prisma.$queryRaw`SELECT 1 as test`;
  console.log('✅ Database connection successful!', result);
  await prisma.$disconnect();
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}
