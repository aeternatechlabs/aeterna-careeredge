import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const check = (val?: string) => {
    if (!val || val.trim().length === 0) return { present: false, length: 0 };
    return {
      present: true,
      length: val.length,
      prefix: val.substring(0, Math.min(val.length, 4)) + "...",
    };
  };

  let supabaseProbe: Record<string, unknown> = { attempted: false };
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("users").select("id").limit(1);
    supabaseProbe = {
      attempted: true,
      ok: !error,
      error: error
        ? {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        : null,
      dataReceived: Boolean(data && data.length > 0),
    };
  } catch (probeErr) {
    supabaseProbe = {
      attempted: true,
      ok: false,
      exception: {
        name: probeErr instanceof Error ? probeErr.name : "UnknownError",
        message: probeErr instanceof Error ? probeErr.message : String(probeErr),
      },
    };
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    checks: {
      DATABASE_URL: check(process.env.DATABASE_URL),
      GOOGLE_CLIENT_ID: check(process.env.GOOGLE_CLIENT_ID),
      GOOGLE_CLIENT_SECRET: check(process.env.GOOGLE_CLIENT_SECRET),
      LINKEDIN_CLIENT_ID: check(process.env.LINKEDIN_CLIENT_ID),
      LINKEDIN_CLIENT_SECRET: check(process.env.LINKEDIN_CLIENT_SECRET),
      BREVO_API_KEY: check(process.env.BREVO_API_KEY),
      RESEND_API_KEY: check(process.env.RESEND_API_KEY),
      AUTH_SECRET: check(process.env.AUTH_SECRET),
      NEXT_PUBLIC_SUPABASE_URL: check(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: check(process.env.SUPABASE_SERVICE_ROLE_KEY),
      NEXT_PUBLIC_APP_URL: check(process.env.NEXT_PUBLIC_APP_URL),
    },
    supabaseProbe,
    flags: {
      hasProcessEnv: typeof process !== "undefined" && typeof process.env !== "undefined",
      envKeysCount: typeof process !== "undefined" && process.env ? Object.keys(process.env).length : 0,
    },
  });
}
