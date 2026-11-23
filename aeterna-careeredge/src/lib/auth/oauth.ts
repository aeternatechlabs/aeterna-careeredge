// src/lib/auth/oauth.ts
// Real Google OAuth architecture with fallback development simulation

import crypto from "crypto";
import { db } from "@/lib/db";

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

/**
 * Safely resolves an authenticated Google user.
 * If user exists: links or returns the user.
 * If user does not exist: creates new user with null passwordHash.
 */
export async function handleGoogleIdentity(profile: {
  email: string;
  name?: string;
  sub: string;
}) {
  const normalizedEmail = profile.email.trim().toLowerCase();
  const userName = profile.name?.trim() || "Google User";

  let user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      onboardingCompleted: true,
      passwordHash: true,
    },
  });

  let isNew = false;

  if (!user) {
    isNew = true;
    user = await db.user.create({
      data: {
        name: userName,
        email: normalizedEmail,
        passwordHash: null, // OAuth user
        onboardingCompleted: false,
        counsellorConsent: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        onboardingCompleted: true,
        passwordHash: true,
      },
    });
  }

  return { user, isNew };
}
