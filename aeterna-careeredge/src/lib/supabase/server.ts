// src/lib/supabase/server.ts
// Server-only Supabase client with elevated service-role privileges.
// Bypasses RLS and connects directly via HTTPS, native to Cloudflare Workers and Node.js.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

const KNOWN_PROJECT_URL = "https://lawehfiwbjxfnbtgeusi.supabase.co";

/**
 * Robustly resolves the Supabase project HTTPS URL.
 * Protects against environment variables containing postgres:// connection strings,
 * bare project refs, or missing http(s) protocols.
 */
export function resolveSupabaseUrl(): string {
  const candidates = [
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const clean = candidate.trim().replace(/^["']|["']$/g, "");
    if (/^https?:\/\//i.test(clean)) {
      return clean.replace(/\/+$/, "");
    }
    // If the variable contains only the 20-character project ref
    if (/^[a-z0-9]{20}$/i.test(clean)) {
      return `https://${clean}.supabase.co`;
    }
  }

  return KNOWN_PROJECT_URL;
}

/**
 * Resolves the Supabase service role / secret API key.
 */
export function resolveSupabaseKey(): string {
  const candidates = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const clean = candidate.trim().replace(/^["']|["']$/g, "");
    if (clean.length > 20) {
      return clean;
    }
  }

  throw new Error("Missing Supabase admin API key (SUPABASE_SERVICE_ROLE_KEY).");
}

/**
 * Returns a singleton Supabase admin client configured with service-role permissions.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = resolveSupabaseUrl();
  const key = resolveSupabaseKey();

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
