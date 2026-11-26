// src/lib/auth/oauth.ts
// Real Google OAuth architecture with native Supabase user persistence

import crypto from "crypto";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { makeRestId } from "@/lib/supabase/rest";

export function resolveRequestOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) {
    const cleanHost = host.split(",")[0].trim();
    const isLocal = cleanHost.includes("localhost") || cleanHost.startsWith("127.0.0.1");
    if (!isLocal || process.env.NODE_ENV !== "production") {
      const protocol = isLocal ? "http" : "https";
      return `${protocol}://${cleanHost}`;
    }
  }
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  return req.nextUrl.origin || "http://localhost:3000";
}

export interface GoogleUserProfile {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

export function isGoogleOAuthConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return Boolean(
    clientId &&
    clientSecret &&
    clientId !== "placeholder_google_client_id" &&
    clientSecret !== "placeholder_google_client_secret"
  );
}

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getGoogleRedirectUri(origin: string): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  return `${origin}/api/auth/callback/google`;
}

export function getGoogleAuthUrl(origin: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const redirectUri = getGoogleRedirectUri(origin);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCodeForTokens(
  code: string,
  origin: string,
  customRedirectUri?: string
): Promise<{ access_token: string; id_token?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = customRedirectUri || getGoogleRedirectUri(origin);

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  return response.json();
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserProfile> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Google user profile: ${errorText}`);
  }

  return response.json();
}

export interface GoogleIdentityUser {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  passwordHash: string | null;
}

/**
 * Safely resolves an authenticated Google user directly via Supabase.
 * If user exists: returns the user.
 * If user does not exist: creates new user with null passwordHash.
 */
export async function handleGoogleIdentity(profile: {
  email: string;
  name?: string;
  sub: string;
}): Promise<{ user: GoogleIdentityUser; isNew: boolean }> {
  const normalizedEmail = profile.email.trim().toLowerCase();
  const userName = profile.name?.trim() || "Google User";
  const supabase = getSupabaseAdmin();

  const { data: existingUser, error: queryErr } = await supabase
    .from("users")
    .select("id, name, email, onboardingCompleted, passwordHash")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (queryErr) {
    throw new Error(`Google identity lookup failed: ${queryErr.message}`);
  }

  if (existingUser) {
    return {
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        onboardingCompleted: Boolean(existingUser.onboardingCompleted),
        passwordHash: existingUser.passwordHash ?? null,
      },
      isNew: false,
    };
  }

  const now = new Date().toISOString();
  const newUserId = makeRestId("usr");
  const { data: newUser, error: createErr } = await supabase
    .from("users")
    .insert({
      id: newUserId,
      name: userName,
      email: normalizedEmail,
      passwordHash: null,
      onboardingCompleted: false,
      counsellorConsent: false,
      createdAt: now,
      updatedAt: now,
    })
    .select("id, name, email, onboardingCompleted, passwordHash")
    .single();

  if (createErr) {
    if (createErr.code === "23505") {
      // Duplicate race condition
      const { data: racedUser } = await supabase
        .from("users")
        .select("id, name, email, onboardingCompleted, passwordHash")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (racedUser) {
        return {
          user: {
            id: racedUser.id,
            name: racedUser.name,
            email: racedUser.email,
            onboardingCompleted: Boolean(racedUser.onboardingCompleted),
            passwordHash: racedUser.passwordHash ?? null,
          },
          isNew: false,
        };
      }
    }
    throw new Error(`Google identity user creation failed: ${createErr.message}`);
  }

  return {
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      onboardingCompleted: Boolean(newUser.onboardingCompleted),
      passwordHash: newUser.passwordHash ?? null,
    },
    isNew: true,
  };
}
