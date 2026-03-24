import { PrismaClient } from "@prisma/client";

declare global {
  var __notifPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__notifPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__notifPrisma = prisma;
}

export default prisma;
