// src/lib/db.ts
// Universal Database Client with Native Supabase PostgREST Edge Engine
// On Cloudflare Workers / Edge Runtime, routes all model operations directly
// through @supabase/supabase-js over HTTPS, completely eliminating edge socket errors.
// Falls back gracefully to standard PrismaClient for local Node.js environments.

import { PrismaClient } from "@prisma/client";
import { getSupabaseAdmin } from "./supabase/server";
import { createSupabasePrismaProxy } from "./supabase/db-proxy";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  rawPrisma?: PrismaClient;
};

const isProduction = process.env.NODE_ENV === "production";
const isEdgeOrWorker = Boolean(
  process.env.CF_PAGES ||
    process.env.CF_WORKER ||
    process.env.WORKERS_ENV ||
    process.env.OPENNEXT ||
    typeof (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime !== "undefined"
);

let lazyPrismaClient: PrismaClient | null = null;

export function isLocalhostDatabaseUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

export function shouldUseLocalPrisma(): boolean {
  if (isEdgeOrWorker || process.env.USE_LOCAL_PRISMA !== "true") {
    return false;
  }
  const effectiveUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  return isLocalhostDatabaseUrl(effectiveUrl);
}

function getPrismaProperty(client: PrismaClient, prop: string): unknown {
  return (client as unknown as Record<string, unknown>)[prop];
}

function getRawPrismaClient(): PrismaClient {
  if (lazyPrismaClient) return lazyPrismaClient;

  const effectiveUrl =
    !isProduction && !isEdgeOrWorker && process.env.DIRECT_URL
      ? process.env.DIRECT_URL
      : process.env.DATABASE_URL;

  const client =
    globalForPrisma.rawPrisma ??
    new PrismaClient({
      datasources: effectiveUrl ? { db: { url: effectiveUrl } } : undefined,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.rawPrisma = client;
  }
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
          return getPrismaProperty(raw, prop);
        } catch {
          return undefined;
        }
      }

      if (shouldUseLocalPrisma()) {
        const raw = getRawPrismaClient();
        return getPrismaProperty(raw, prop);
      }

      // If running in edge/worker isolate or Supabase credentials are configured,
      // route natively via Supabase client over HTTPS (zero TCP socket issues).
      if (isEdgeOrWorker || isProduction) {
        return supabaseProxy[prop];
      }

      let supabase = null;
      try {
        supabase = getSupabaseAdmin();
      } catch {
        supabase = null;
      }
      if (supabase) {
        return supabaseProxy[prop];
      }

      try {
        const raw = getRawPrismaClient();
        return getPrismaProperty(raw, prop);
      } catch {
        return supabaseProxy[prop];
      }
    },
  }
) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
