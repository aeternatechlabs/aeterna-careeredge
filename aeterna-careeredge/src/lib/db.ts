// src/lib/db.ts
// Singleton Prisma client — prevents too many connections during hot reload in dev
// Uses DIRECT_URL for persistent Node.js/dev environments (4x-5x lower latency than PgBouncer pooler),
// and falls back to DATABASE_URL (PgBouncer pooler) in serverless environments (e.g. Vercel).

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const effectiveUrl = !isServerless && process.env.DIRECT_URL ? process.env.DIRECT_URL : process.env.DATABASE_URL;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: effectiveUrl ? { db: { url: effectiveUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
