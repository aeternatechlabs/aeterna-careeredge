// src/lib/supabase/server.ts
// Server-only Supabase client with elevated service-role privileges.
// Bypasses RLS and connects directly via HTTPS, native to Cloudflare Workers and Node.js.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase admin client configured with service-role permissions.
 * Throws a descriptive configuration error if required environment variables are absent.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!rawUrl || !rawKey) {
    throw new Error(
      "Missing Supabase admin credentials: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be defined."
    );
  }

  const url = rawUrl.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  const key = rawKey.trim().replace(/^["']|["']$/g, "");

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "User-Agent": "Aeterna-CareerEdge-Backend/1.0 (Cloudflare-Worker)",
        },
      },
    });
  }

  return adminClient;
}
