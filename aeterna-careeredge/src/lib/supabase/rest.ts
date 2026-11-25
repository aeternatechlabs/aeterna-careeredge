// src/lib/supabase/rest.ts
// Server-only Supabase PostgREST helper for edge runtimes (e.g., Cloudflare Workers)
// where Prisma's native TCP engine cannot run.

export interface SupabaseRestConfig {
  baseUrl: string;
  headers: Record<string, string>;
}

/**
 * Returns Supabase PostgREST config using server-side service-role credentials only.
 * Never falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
import { resolveSupabaseUrl, resolveSupabaseKey } from "./server";

export function getSupabaseRestConfig(): SupabaseRestConfig | null {
  try {
    const baseUrl = resolveSupabaseUrl();
    const serviceKey = resolveSupabaseKey();

    return {
      baseUrl,
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        "User-Agent": "Aeterna-CareerEdge-Backend/1.0 (Cloudflare-Worker)",
      },
    };
  } catch {
    return null;
  }
}

/** Generates a prefixed unique identifier compatible with string ID columns. */
export function makeRestId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  return `${prefix}_${rand}`;
}

export interface SupabaseRestResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  errorText: string;
}

/** Executes a request against Supabase PostgREST and parses JSON safely. */
export async function supabaseRestFetch<T>(
  config: SupabaseRestConfig,
  pathWithQuery: string,
  init?: RequestInit
): Promise<SupabaseRestResponse<T>> {
  const res = await fetch(`${config.baseUrl}${pathWithQuery}`, {
    ...init,
    headers: {
      ...config.headers,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    return { ok: false, status: res.status, data: null, errorText };
  }

  const data = (await res.json().catch(() => null)) as T | null;
  return { ok: true, status: res.status, data, errorText: "" };
}
