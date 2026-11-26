// src/app/api/auth/callback/google/route.ts
// Handles Google OAuth callback at /api/auth/callback/google (standard NextAuth / Google Console path)

import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleCodeForTokens,
  fetchGoogleUserInfo,
  handleGoogleIdentity,
  resolveRequestOrigin,
} from "@/lib/auth/oauth";
import { setSessionCookie, createSession, isSecureCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const origin = resolveRequestOrigin(req);

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
    // Exchange authorization code for access token using this exact callback URI
    const tokenData = await exchangeGoogleCodeForTokens(
      code,
      origin,
      `${origin}/api/auth/callback/google`
    );

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
    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      onboardingCompleted: user.onboardingCompleted,
    };
    const sessionToken = await createSession(sessionPayload);
    await setSessionCookie(sessionPayload);

    const nextCookie = req.cookies.get("ace_oauth_next")?.value;
    const defaultTarget = user.onboardingCompleted ? "/dashboard" : "/onboarding";
    let targetUrl = defaultTarget;
    if (nextCookie && nextCookie.startsWith("/") && !nextCookie.startsWith("//") && user.onboardingCompleted) {
      targetUrl = nextCookie;
    }

    const response = NextResponse.redirect(new URL(targetUrl, origin));

    // Ensure session cookie is set directly on redirect response
    response.cookies.set("ace_session", sessionToken, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Clear state and next cookies
    response.cookies.delete("ace_oauth_state");
    response.cookies.delete("ace_oauth_next");

    return response;
  } catch (error) {
    console.error("[OAuth Callback Exception]:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_processing_failed", origin)
    );
  }
}
