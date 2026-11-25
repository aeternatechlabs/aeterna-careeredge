// src/app/api/auth/logout/route.ts
// POST /api/auth/logout — clears the session cookie

import { NextResponse } from "next/server";
import { clearSessionCookie, isSecureCookie, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(): Promise<NextResponse> {
  try {
    await clearSessionCookie();
  } catch {
    // response.cookies.set below clears the cookie directly on the HTTP response
  }

  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
