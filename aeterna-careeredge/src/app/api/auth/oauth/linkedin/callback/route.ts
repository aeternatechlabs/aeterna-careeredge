// src/app/api/auth/oauth/linkedin/callback/route.ts
// LinkedIn OpenID Connect Callback Handler (Day 2 Part 4.1)

import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, SESSION_COOKIE_NAME, isSecureCookie } from "@/lib/session";
import { db } from "@/lib/db";
import {
  exchangeLinkedInCode,
  fetchLinkedInUserInfo,
  linkLinkedInAccount,
} from "@/lib/linkedin/oauth";

export const dynamic = "force-dynamic";

function resolveOrigin(req: NextRequest): string {
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) {
    const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocol}://${host}`;
  }
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const origin = resolveOrigin(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(`/linkedin?error=${encodeURIComponent(errorDescription || error)}`, origin)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/linkedin?error=Missing+authorization+code+or+state", origin)
    );
  }

  // Verify CSRF State Cookie strictly
  const savedState = req.cookies.get("linkedin_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/linkedin?error=Invalid+or+expired+state+parameter+detected", origin)
    );
  }

  try {
    const session = await getSession(req);
    const cookieUid = req.cookies.get("linkedin_oauth_uid")?.value;
    const initialUserId = session?.userId || cookieUid;

    const redirectUri = `${origin}/api/auth/oauth/linkedin/callback`;

    // 1. Exchange Code on Server
    const accessToken = await exchangeLinkedInCode({ code, redirectUri });

    // 2. Fetch UserInfo
    const identity = await fetchLinkedInUserInfo(accessToken);

    // 3. Resolve student user safely
    let resolvedUser = initialUserId
      ? await db.user.findUnique({ where: { id: initialUserId } })
      : null;

    if (!resolvedUser && identity.sub) {
      const linked = await db.linkedInProfile.findFirst({
        where: { linkedInSubId: identity.sub },
        include: { user: true },
      });
      if (linked?.user) resolvedUser = linked.user;
    }

    if (!resolvedUser && identity.email) {
      resolvedUser = await db.user.findUnique({
        where: { email: identity.email.toLowerCase().trim() },
      });
    }

    if (!resolvedUser) {
      return NextResponse.redirect(
        new URL(
          "/login?next=/linkedin&error=" +
            encodeURIComponent("Please log in to your CareerEdge account before connecting LinkedIn."),
          origin
        )
      );
    }

    // 4. Link account to student profile
    await linkLinkedInAccount(resolvedUser.id, identity);

    // 5. Explicitly set session cookie on the redirect response so user is 100% authenticated
    const token = await createSession({
      userId: resolvedUser.id,
      email: resolvedUser.email,
      name: resolvedUser.name,
      onboardingCompleted: resolvedUser.onboardingCompleted,
    });

    const res = NextResponse.redirect(new URL("/linkedin?connected=true", origin));
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.delete("linkedin_oauth_state");
    res.cookies.delete("linkedin_oauth_nonce");
    res.cookies.delete("linkedin_oauth_uid");
    return res;
  } catch (err: unknown) {
    return NextResponse.redirect(
      new URL(`/linkedin?error=${encodeURIComponent((err as Error).message || "Connection failed")}`, origin)
    );
  }
}
