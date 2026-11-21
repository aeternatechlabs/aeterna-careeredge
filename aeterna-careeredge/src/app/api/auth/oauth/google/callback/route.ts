// src/app/api/auth/oauth/google/callback/route.ts
// Google OAuth callback handling token exchange, user identity, and session

import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleCodeForTokens,
  fetchGoogleUserInfo,
  handleGoogleIdentity,
} from "@/lib/auth/oauth";
import { setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    req.headers.get("origin") ||
    req.nextUrl.origin ||
    "http://localhost:3000";

  if (oauthError) {
    console.error("[OAuth Error from Google]:", oauthError);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(oauthError)}`, origin)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_oauth_response", origin)
    );
  }

  // Verify CSRF state
  const storedState = req.cookies.get("ace_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    console.error("[OAuth CSRF Mismatch]");
    return NextResponse.redirect(
      new URL("/login?error=oauth_state_mismatch", origin)
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenData = await exchangeGoogleCodeForTokens(code, origin);

    // Fetch verified profile from Google
    const profile = await fetchGoogleUserInfo(tokenData.access_token);

    if (!profile.email) {
      return NextResponse.redirect(
        new URL("/login?error=missing_email_from_oauth", origin)
      );
    }

    // Resolve or create user account
    const { user } = await handleGoogleIdentity(profile);

    // Set authenticated session
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      onboardingCompleted: user.onboardingCompleted,
    });

    const targetUrl = user.onboardingCompleted ? "/dashboard" : "/onboarding";
    const response = NextResponse.redirect(new URL(targetUrl, origin));

    // Clear state cookie
    response.cookies.delete("ace_oauth_state");

    return response;
  } catch (error) {
    console.error("[OAuth Callback Exception]:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_processing_failed", origin)
    );
  }
}
