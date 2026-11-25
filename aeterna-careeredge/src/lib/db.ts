// src/lib/db.ts
// Universal Database Client with Native Supabase PostgREST Edge Engine
// On Cloudflare Workers / Edge Runtime, routes all model operations directly
// through @supabase/supabase-js over HTTPS, completely eliminating edge socket errors.
// Falls back gracefully to standard PrismaClient for local Node.js environments.

import { PrismaClient } from "@prisma/client";
import { getSupabaseAdmin } from "./supabase/server";
import { createSupabasePrismaProxy } from "./supabase/db-proxy";

const globalForPrisma = globalThis as unknown as { prisma?: any };

const isProduction = process.env.NODE_ENV === "production";
const isEdgeOrWorker = Boolean(
  process.env.CF_PAGES ||
  process.env.CF_WORKER ||
  process.env.WORKERS_ENV ||
  process.env.OPENNEXT ||
  typeof (globalThis as any).EdgeRuntime !== "undefined"
);

let lazyPrismaClient: PrismaClient | null = null;

function getRawPrismaClient(): PrismaClient {
  if (lazyPrismaClient) return lazyPrismaClient;

  const effectiveUrl =
    !isProduction && !isEdgeOrWorker && process.env.DIRECT_URL
      ? process.env.DIRECT_URL
      : process.env.DATABASE_URL;

  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      datasources: effectiveUrl ? { db: { url: effectiveUrl } } : undefined,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

  lazyPrismaClient = client;
  return client;
}

const supabaseProxy = createSupabasePrismaProxy(getSupabaseAdmin);

export const db: PrismaClient = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (typeof prop !== "string" || prop.startsWith("$") || prop.startsWith("_")) {
        try {
          const raw = getRawPrismaClient();
          return (raw as any)[prop];
        } catch {
          return undefined;
        }
      }

      // If running in edge/worker isolate or Supabase credentials are configured,
      // route natively via Supabase client over HTTPS (zero TCP socket issues).
      const supabase = getSupabaseAdmin();
      if (isEdgeOrWorker || supabase) {
        return supabaseProxy[prop];
      }

      try {
        const raw = getRawPrismaClient();
        return (raw as any)[prop];
      } catch {
        return supabaseProxy[prop];
      }
    },
  }
) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
