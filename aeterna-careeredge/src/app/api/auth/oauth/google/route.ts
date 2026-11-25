// src/app/api/auth/oauth/google/route.ts
// Initiates Google OAuth or redirects to dev mock if not configured in dev

import { NextRequest, NextResponse } from "next/server";
import {
  isGoogleOAuthConfigured,
  generateOAuthState,
  getGoogleAuthUrl,
} from "@/lib/auth/oauth";
import { isSecureCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    req.headers.get("origin") ||
    req.nextUrl.origin ||
    "http://localhost:3000";

  const next = req.nextUrl.searchParams.get("next");

  // Check if real Google OAuth is configured
  if (!isGoogleOAuthConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[OAuth Google 503] Missing Google OAuth credentials in runtime env", {
        hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
        hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      });
      return NextResponse.json(
        { error: "Google OAuth is not configured on this server." },
        { status: 503 }
      );
    }

    // In development mode without credentials, redirect to dev simulation
    console.log("ℹ️ [OAUTH DEV] Google credentials not found. Routing to /api/auth/oauth/dev-mock");
    const devMockUrl = new URL("/api/auth/oauth/dev-mock", origin);
    if (next) devMockUrl.searchParams.set("next", next);
    return NextResponse.redirect(devMockUrl);
  }

  // Real OAuth flow
  const state = generateOAuthState();
  const authUrl = getGoogleAuthUrl(origin, state);

  const response = NextResponse.redirect(authUrl);

  // Set CSRF state cookie with httpOnly, 10 minutes expiry
  response.cookies.set("ace_oauth_state", state, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    response.cookies.set("ace_oauth_next", next, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  }

  return response;
}
