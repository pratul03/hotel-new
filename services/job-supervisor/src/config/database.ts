import { PrismaClient } from "@prisma/client";

declare global {
  var __supervisorPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__supervisorPrisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") {
  global.__supervisorPrisma = prisma;
}

export default prisma;
