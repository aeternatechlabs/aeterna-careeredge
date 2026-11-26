// src/lib/session.ts
// JWT session management using jose (edge-compatible)

import { SignJWT, jwtVerify, decodeJwt } from "jose";
import { cookies, headers } from "next/headers";

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
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

let cachedNormSecret = "";
let cachedPrimarySecret: Uint8Array | null = null;
let cachedCandidateSecrets: Uint8Array[] | null = null;

function getNormalizedSecret(): string {
  let secret = process.env.AUTH_SECRET;
  if (!secret) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("path");
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const match = fs.readFileSync(envPath, "utf8").match(/AUTH_SECRET=["']?([^"'\r\n]+)["']?/);
        if (match) secret = match[1];
      }
    } catch {}
  }

  if (process.env.NODE_ENV === "production" && (!secret || secret.trim().length < 32)) {
    throw new Error(
      "FATAL: AUTH_SECRET must be configured in production and be at least 32 characters long."
    );
  }

  const norm = (secret || "dev_secret_careeredge_minimum_32_characters_for_local_testing").trim().replace(/^["']|["']$/g, "");
  if (norm !== cachedNormSecret) {
    cachedNormSecret = norm;
    cachedPrimarySecret = null;
    cachedCandidateSecrets = null;
  }
  return cachedNormSecret;
}

function getSecret(): Uint8Array {
  const norm = getNormalizedSecret();
  if (!cachedPrimarySecret) {
    cachedPrimarySecret = new TextEncoder().encode(norm);
  }
  return cachedPrimarySecret;
}

function getSecretCandidates(): Uint8Array[] {
  const norm = getNormalizedSecret();
  if (!cachedCandidateSecrets) {
    const list =
      process.env.NODE_ENV === "production"
        ? [norm, `"${norm}"`]
        : [
            norm,
            `"${norm}"`,
            "dev_secret_careeredge_minimum_32_characters_for_local_testing",
            "test-secret-key-for-unit-testing-32chars",
          ];
    const seen = new Set<string>();
    const result: Uint8Array[] = [];
    for (const c of list) {
      if (!seen.has(c)) {
        seen.add(c);
        result.push(new TextEncoder().encode(c));
      }
    }
    cachedCandidateSecrets = result;
  }
  return cachedCandidateSecrets;
}

// ── Payload stored inside the JWT ────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  onboardingCompleted: boolean;
}

// ── Base64URL Sanitizer (RFC 7515 spec-compliant) ───────────────────────────

export function toBase64UrlToken(token: string): string {
  if (!token) return "";
  const parts = token.trim().split(".");
  if (parts.length === 3) {
    return parts
      .map((part) =>
        part
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")
      )
      .join(".");
  }
  return token;
}

// ── Create and sign a session JWT ────────────────────────────────────────────

export async function createSession(payload: SessionPayload): Promise<string> {
  const secret = getSecret();

  const rawToken = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);

  return toBase64UrlToken(rawToken);
}

// ── Verify and decode a JWT ───────────────────────────────────────────────────

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    let cleanToken = token.trim().replace(/^["']|["']$/g, "");
    try {
      if (cleanToken.includes("%")) {
        cleanToken = decodeURIComponent(cleanToken);
      }
    } catch {}
    cleanToken = cleanToken.trim().replace(/^["']|["']$/g, "").replace(/\s+/g, "");

    // Convert any standard base64 (+, /, =) into pure base64url (-, _, no padding)
    cleanToken = toBase64UrlToken(cleanToken);

    // Extract exactly the 3-part base64url Compact JWS if there are trailing semicolons, path attributes or quotes
    const jwtMatch = cleanToken.match(/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
    if (jwtMatch) {
      cleanToken = jwtMatch[1];
    }

    let payload: Record<string, unknown> | null = null;
    let lastError: string | null = null;
    // Fast path: verify with primary secret first
    try {
      const res = await jwtVerify(cleanToken, getSecret());
      payload = res.payload as Record<string, unknown>;
    } catch (err) {
      lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      // Fallback path: iterate through candidates
      const secrets = getSecretCandidates();
      for (const secret of secrets) {
        try {
          const res = await jwtVerify(cleanToken, secret);
          payload = res.payload as Record<string, unknown>;
          break;
        } catch {}
      }
    }

    // Strictly require cryptographic signature verification with secrets
    if (!payload) {
      const partLengths = cleanToken.split(".").map((p) => p.length);
      console.warn("[verifySession] JWT verification failed:", {
        error: lastError || "unknown",
        partLengths,
      });
      return null;
    }

    const rawPayload = payload as Record<string, unknown>;
    const userId = (payload.userId ||
      (typeof rawPayload.id === "string" ? rawPayload.id : undefined) ||
      (typeof rawPayload.sub === "string" ? rawPayload.sub : undefined) ||
      "") as string;

    return {
      userId,
      email: (payload.email || "") as string,
      name: (payload.name || "") as string,
      onboardingCompleted: Boolean(payload.onboardingCompleted),
    };
  } catch {
    return null;
  }
}

export function isSecureCookie(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  // In production, default to true unless running on local development host
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_APP_URL?.includes("localhost")) {
    return true;
  }
  // If explicitly hosted on HTTPS, use secure
  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")) return true;
  // Over local HTTP (e.g. localhost:3000 or 10.31.248.221:3000), do NOT set secure so browsers accept the cookie
  return false;
}

// ── Set the session cookie (Server Action / Route Handler only) ───────────────

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSession(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

// ── Clear the session cookie ─────────────────────────────────────────────────

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// ── Read and verify the current session from the cookie store or request ────

export async function getSession(req?: {
  cookies?: { get: (name: string) => { value: string } | undefined };
  headers?: { get: (name: string) => string | null };
}): Promise<SessionPayload | null> {
  let token: string | undefined;

  // 1. Try NextRequest cookies
  if (req?.cookies && typeof req.cookies.get === "function") {
    token = req.cookies.get(SESSION_COOKIE)?.value;
  }

  // 2. Try raw Cookie header
  if (!token && req?.headers && typeof req.headers.get === "function") {
    const rawCookie = req.headers.get("cookie") || "";
    const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
    if (match) token = match[1];
  }

  // 3. Fallback to Next.js cookieStore
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE)?.value;
    } catch {
      // In route handlers or edge context without cookies()
    }
  }

  if (token) {
    const verified = await verifySession(token);
    if (verified) return verified;
  }

  // 3b. If multiple ace_session cookies exist in raw Cookie header, try all of them
  if (req?.headers && typeof req.headers.get === "function") {
    const rawCookie = req.headers.get("cookie") || "";
    const allMatches = rawCookie.matchAll(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`, "g"));
    for (const m of allMatches) {
      const candidate = m[1];
      if (candidate && candidate !== token) {
        const verified = await verifySession(candidate);
        if (verified) return verified;
      }
    }
  }

  // 4. Fallback to cookieStore.getAll() and next/headers cookie header (critical for Server Components on CF Workers)
  try {
    const cookieStore = await cookies();
    const allStoreCookies = cookieStore.getAll(SESSION_COOKIE);
    for (const c of allStoreCookies) {
      if (c.value && c.value !== token) {
        const verified = await verifySession(c.value);
        if (verified) return verified;
      }
    }
  } catch {}

  if (!req) {
    try {
      const headerStore = await headers();
      const rawCookie = headerStore.get("cookie") || "";
      const allMatches = rawCookie.matchAll(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`, "g"));
      for (const m of allMatches) {
        const candidate = m[1];
        if (candidate && candidate !== token) {
          const verified = await verifySession(candidate);
          if (verified) return verified;
        }
      }
    } catch {}
  }

  return null;
}

// ── Read the raw JWT from cookies (for proxy.ts — cannot import cookies()) ───
// Use this in proxy.ts by reading the cookie from the request object directly.

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
