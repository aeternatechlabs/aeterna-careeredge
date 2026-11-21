// src/app/api/auth/oauth/linkedin/callback/route.ts
// LinkedIn OpenID Connect Callback Handler (Day 2 Part 4.1)

import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, SESSION_COOKIE_NAME, isSecureCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  exchangeLinkedInCode,
  fetchLinkedInUserInfo,
  linkLinkedInAccount,
} from "@/lib/linkedin/oauth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(`/linkedin?error=${encodeURIComponent(errorDescription || error)}`, req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/linkedin?error=Missing+authorization+code+or+state", req.url)
    );
  }

  // Verify CSRF State Cookie strictly
  const savedState = req.cookies.get("linkedin_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/linkedin?error=Invalid+or+expired+state+parameter+detected", req.url)
    );
  }

  try {
    const session = (await getSession(req)) || (await getSession());
    const cookieUid = req.cookies.get("linkedin_oauth_uid")?.value;
    const initialUserId = session?.userId || cookieUid;

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/auth/oauth/linkedin/callback`;

    // 1. Exchange Code on Server
    const accessToken = await exchangeLinkedInCode({ code, redirectUri });

    // 2. Fetch UserInfo
    const identity = await fetchLinkedInUserInfo(accessToken);

    // 3. Resolve student user safely
    let resolvedUser = initialUserId
      ? await prisma.user.findUnique({ where: { id: initialUserId } })
      : null;

    if (!resolvedUser && identity.sub) {
      const linked = await prisma.linkedInProfile.findFirst({
        where: { linkedInSubId: identity.sub },
        include: { user: true },
      });
      if (linked?.user) resolvedUser = linked.user;
    }

    if (!resolvedUser && identity.email) {
      resolvedUser = await prisma.user.findUnique({
        where: { email: identity.email.toLowerCase().trim() },
      });
    }

    if (!resolvedUser) {
      return NextResponse.redirect(
        new URL(
          "/login?next=/linkedin&error=" +
            encodeURIComponent("Please log in to your CareerEdge account before connecting LinkedIn."),
          req.url
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

    const res = NextResponse.redirect(new URL("/linkedin?connected=true", req.url));
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
      new URL(`/linkedin?error=${encodeURIComponent((err as Error).message || "Connection failed")}`, req.url)
    );
  }
}
