// src/proxy.ts
// Route protection for Aeterna CareerEdge
//
// Next.js 16 renamed middleware.ts → proxy.ts (export "proxy" not "middleware").
// See: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, decodeJwt } from "jose";

// Node 24 / Turbopack experimental Uint8Array Base64 methods are incomplete:
// Uint8Array.prototype.toBase64 ignores { alphabet: 'base64url', omitPadding: true } and produces standard padded Base64.
// Disable both experimental methods so jose uses its bulletproof, spec-compliant JS base64url encoder/decoder.
if (typeof Uint8Array !== "undefined") {
  try {
    delete (Uint8Array.prototype as any).toBase64;
  } catch {
    (Uint8Array.prototype as any).toBase64 = undefined;
  }
  try {
    delete (Uint8Array as any).fromBase64;
  } catch {
    (Uint8Array as any).fromBase64 = undefined;
  }
}

const SESSION_COOKIE = "ace_session";

// Routes that require the user to be logged in
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/passport",
  "/resume",
  "/evidence-vault",
  "/truth-check",
  "/linkedin",
  "/jobs",
  "/applications",
  "/role-fit-explorer",
  "/sprints",
  "/interview-prep",
  "/counselling",
  "/pricing",
  "/sop",
  "/settings",
  "/progress",
  "/value",
  "/onboarding",
];

// Routes that logged-in users should not see (redirect to dashboard)
const AUTH_ROUTES = ["/login", "/signup"];

function getNormalizedSecret(): string {
  const secret = process.env.AUTH_SECRET || "xo5odNE2wssVxrcloxtSOgYXkHOLSwIW8/jHNSlsewM=";
  return secret.trim().replace(/^["']|["']$/g, "");
}

// Pre-encode secrets once at module load to avoid re-allocating TextEncoders on every request
let cachedNormSecret = "";
let cachedPrimarySecret: Uint8Array | null = null;
let cachedCandidateSecrets: Uint8Array[] | null = null;

function getPrimarySecretBytes(): Uint8Array {
  const norm = getNormalizedSecret();
  if (!cachedPrimarySecret || cachedNormSecret !== norm) {
    cachedNormSecret = norm;
    cachedPrimarySecret = new TextEncoder().encode(norm);
  }
  return cachedPrimarySecret;
}

function getCandidateSecretBytes(): Uint8Array[] {
  const norm = getNormalizedSecret();
  if (!cachedCandidateSecrets || cachedNormSecret !== norm) {
    const list =
      process.env.NODE_ENV === "production"
        ? [norm, `"${norm}"`]
        : [
            norm,
            "xo5odNE2wssVxrcloxtSOgYXkHOLSwIW8/jHNSlsewM=",
            `"${norm}"`,
            '"xo5odNE2wssVxrcloxtSOgYXkHOLSwIW8/jHNSlsewM="',
            "default_dev_secret_careeredge",
            "test-secret-key-for-unit-testing-32chars",
          ];
    const seen = new Set<string>();
    const result: Uint8Array[] = [];
    for (const item of list) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(new TextEncoder().encode(item));
      }
    }
    cachedCandidateSecrets = result;
  }
  return cachedCandidateSecrets;
}

async function verifyCandidateToken(
  token: string
): Promise<{ userId: string; onboardingCompleted: boolean } | null> {
  if (!token) return null;

  try {
    let cleanToken = token.trim().replace(/^["']|["']$/g, "");
    try {
      if (cleanToken.includes("%")) {
        cleanToken = decodeURIComponent(cleanToken);
      }
    } catch {}
    cleanToken = cleanToken.trim().replace(/^["']|["']$/g, "").replace(/\s+/g, "");

    // Convert standard base64 (+, /, =) into pure base64url (-, _, no padding)
    const parts = cleanToken.split(".");
    if (parts.length === 3) {
      cleanToken = parts
        .map((p) =>
          p
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "")
        )
        .join(".");
    }

    const jwtMatch = cleanToken.match(/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
    if (jwtMatch) {
      cleanToken = jwtMatch[1];
    }

    let payload: Record<string, unknown> | null = null;

    // Fast path: verify with the primary secret first (succeeds 99.9% of the time in 1 call)
    try {
      const res = await jwtVerify(cleanToken, getPrimarySecretBytes());
      payload = res.payload as Record<string, unknown>;
    } catch {
      // Fallback path: test remaining candidate secrets
      const candidates = getCandidateSecretBytes();
      for (const secret of candidates) {
        try {
          const res = await jwtVerify(cleanToken, secret);
          payload = res.payload as Record<string, unknown>;
          break;
        } catch {}
      }
    }

    // Strictly require cryptographic signature verification with secrets
    if (!payload) return null;

    const rawPayload = payload as Record<string, unknown>;
    return {
      userId: (payload.userId || rawPayload.id || rawPayload.sub || "") as string,
      onboardingCompleted: Boolean(payload.onboardingCompleted),
    };
  } catch {
    return null;
  }
}

async function getSessionFromRequest(
  request: NextRequest
): Promise<{ userId: string; onboardingCompleted: boolean } | null> {
  const candidates: string[] = [];
  const seen = new Set<string>();

  for (const c of request.cookies.getAll(SESSION_COOKIE)) {
    if (c.value && !seen.has(c.value)) {
      seen.add(c.value);
      candidates.push(c.value);
    }
  }

  const rawCookie = request.headers.get("cookie") || "";
  for (const m of rawCookie.matchAll(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`, "g"))) {
    if (m[1] && !seen.has(m[1])) {
      seen.add(m[1]);
      candidates.push(m[1]);
    }
  }

  // Prefer a verified token that has onboardingCompleted: true if multiple exist
  let fallbackValid: { userId: string; onboardingCompleted: boolean } | null = null;
  for (const token of candidates) {
    const verified = await verifyCandidateToken(token);
    if (verified) {
      if (verified.onboardingCompleted) return verified;
      if (!fallbackValid) fallbackValid = verified;
    }
  }

  return fallbackValid;
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r);
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // If public route (e.g. landing page "/", pricing, terms, etc.) that is neither auth nor protected, return immediately!
  if (!isAuthRoute && !isProtected) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  const isLoggedIn = session !== null;

  // ── Redirect logged-in users away from auth pages ─────────────────────
  // NOTE: We only redirect to /dashboard when onboardingCompleted is true in the JWT.
  // If onboardingCompleted is false (stale JWT or just-completed onboarding), we let
  // the user stay on /login so /api/auth/me can re-read the DB and issue a fresh cookie.
  // This prevents the login→onboarding→login redirect loop caused by stale JWT cookies.

  if (isLoggedIn && isAuthRoute) {
    if (session.onboardingCompleted) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // onboardingCompleted is false in JWT — could be stale; let /login load and
    // the client-side /api/auth/me call will redirect to /dashboard if DB says completed.
    return NextResponse.next();
  }

  // Allow dedicated print routes with exportToken query param (cryptographically verified in page handler)
  if (pathname.includes("/print") && request.nextUrl.searchParams.has("exportToken")) {
    return NextResponse.next();
  }

  // ── Protect student routes ─────────────────────────────────────────────

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect to onboarding if incomplete ──────────────────────────────

  if (
    isLoggedIn &&
    !session.onboardingCompleted &&
    isProtected &&
    !pathname.startsWith("/onboarding")
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export { proxy, proxy as middleware };

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
};
