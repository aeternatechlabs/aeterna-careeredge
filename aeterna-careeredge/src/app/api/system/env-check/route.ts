import { NextResponse } from "next/server";

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
    flags: {
      hasProcessEnv: typeof process !== "undefined" && typeof process.env !== "undefined",
      envKeysCount: typeof process !== "undefined" && process.env ? Object.keys(process.env).length : 0,
    },
  });
}
