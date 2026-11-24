// src/app/api/auth/oauth/linkedin/route.ts
// LinkedIn OpenID Connect Initiation & Disconnection API (Day 2 Part 4.1)

import { NextRequest, NextResponse } from "next/server";
import { getSession, isSecureCookie } from "@/lib/session";
import {
  isLinkedInConfigured,
  generateLinkedInAuthUrl,
  disconnectLinkedInAccount,
} from "@/lib/linkedin/oauth";

export async function GET(req: NextRequest) {
  try {
    const session = (await getSession(req)) || (await getSession());
    if (!session || !session.userId) {
      return NextResponse.redirect(new URL("/login?next=/linkedin", req.url));
    }

    if (!isLinkedInConfigured()) {
      return NextResponse.redirect(
        new URL(
          "/linkedin?error=" +
            encodeURIComponent("LinkedIn integration credentials are not configured on this server."),
          req.url
        )
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/auth/oauth/linkedin/callback`;

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
      new URL(`/linkedin?error=${encodeURIComponent(message)}`, req.url)
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
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
