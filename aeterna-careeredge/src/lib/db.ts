// src/lib/db.ts
// Singleton Prisma client — prevents too many connections during hot reload in dev.
// In production or serverless environments (Cloudflare Workers, Vercel, AWS Lambda),
// uses DATABASE_URL (PgBouncer/Supavisor pooler) to avoid exhausting PostgreSQL connections.
// Uses DIRECT_URL only for local development if specified.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const isProduction = process.env.NODE_ENV === "production";
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.CF_PAGES ||
  process.env.CF_WORKER ||
  process.env.WORKERS_ENV ||
  process.env.OPENNEXT
);

const effectiveUrl =
  !isProduction && !isServerless && process.env.DIRECT_URL
    ? process.env.DIRECT_URL
    : process.env.DATABASE_URL;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: effectiveUrl ? { db: { url: effectiveUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
