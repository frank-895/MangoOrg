import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Avoid creating Prisma client during build time
const createPrismaClient = () => {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    // Return a mock client during build
    return {} as PrismaClient
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma



