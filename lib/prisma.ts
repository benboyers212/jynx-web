import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

// ✅ support BOTH import styles:
//   import prisma from "@/lib/prisma"
//   import { prisma } from "@/lib/prisma"
export const prisma = prismaClient;
export default prismaClient;
