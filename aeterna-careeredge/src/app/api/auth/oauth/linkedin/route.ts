// src/app/api/auth/oauth/linkedin/route.ts
// LinkedIn OpenID Connect Initiation & Disconnection API (Day 2 Part 4.1)

import { NextRequest, NextResponse } from "next/server";
import { getSession, isSecureCookie } from "@/lib/session";
import {
  isLinkedInConfigured,
  generateLinkedInAuthUrl,
  disconnectLinkedInAccount,
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
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.redirect(new URL("/login?next=/linkedin", origin));
    }

    if (!isLinkedInConfigured()) {
      return NextResponse.redirect(
        new URL(
          "/linkedin?error=" +
            encodeURIComponent("LinkedIn integration credentials are not configured on this server."),
          origin
        )
      );
    }

    const redirectUri = `${origin}/api/auth/oauth/linkedin/callback`;

    const { url: authUrl, state, nonce } = generateLinkedInAuthUrl(redirectUri);

    const response = NextResponse.redirect(authUrl);
    // Set CSRF verification cookies with explicit sameSite: "lax" so cross-site redirects preserve them
    response.cookies.set("linkedin_oauth_state", state, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });
    response.cookies.set("linkedin_oauth_nonce", nonce, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    response.cookies.set("linkedin_oauth_uid", session.userId, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    const message = (err as Error).message || "Could not initialize LinkedIn OAuth.";
    return NextResponse.redirect(
      new URL(`/linkedin?error=${encodeURIComponent(message)}`, origin)
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await disconnectLinkedInAccount(session.userId);
    return NextResponse.json({ success: true, message: "LinkedIn account disconnected." });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to disconnect account." },
      { status: 500 }
    );
  }
}
