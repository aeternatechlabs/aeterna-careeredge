// src/lib/linkedin/oauth.ts
// LinkedIn OpenID Connect Integration (Day 2 Part 4.1)
// Follows official LinkedIn OIDC specifications. Keeps client secrets strictly server-side.

import crypto from "crypto";
import { db } from "@/lib/db";

export interface LinkedInIdentity {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

export function isLinkedInConfigured(): boolean {
  return Boolean(
    process.env.LINKEDIN_CLIENT_ID &&
    process.env.LINKEDIN_CLIENT_SECRET &&
    process.env.LINKEDIN_CLIENT_ID.trim().length > 0 &&
    process.env.LINKEDIN_CLIENT_SECRET.trim().length > 0
  );
}

/**
 * Generate LinkedIn OIDC Authorization URL with cryptographically secure state and nonce.
 */
export function generateLinkedInAuthUrl(redirectUri: string): {
  url: string;
  state: string;
  nonce: string;
} {
  if (!isLinkedInConfigured()) {
    throw new Error("LinkedIn credentials are not configured in environment variables.");
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!.trim();
  const state = crypto.randomBytes(24).toString("hex");
  const nonce = crypto.randomBytes(24).toString("hex");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    nonce,
    scope: "openid profile email",
  });

  return {
    url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`,
    state,
    nonce,
  };
}

/**
 * Exchange Authorization Code for Access Token on the server.
 */
export async function exchangeLinkedInCode(params: {
  code: string;
  redirectUri: string;
}): Promise<string> {
  const clientId = process.env.LINKEDIN_CLIENT_ID!.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!.trim();

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`LinkedIn token exchange failed: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

/**
 * Fetch basic identity profile from LinkedIn OpenID Connect UserInfo endpoint.
 */
export async function fetchLinkedInUserInfo(accessToken: string): Promise<LinkedInIdentity> {
  const userinfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userinfoRes.ok) {
    throw new Error(`Failed to fetch LinkedIn userinfo: ${userinfoRes.statusText}`);
  }

  return (await userinfoRes.json()) as LinkedInIdentity;
}

/**
 * Link LinkedIn identity to student user in database.
 */
export async function linkLinkedInAccount(userId: string, identity: LinkedInIdentity) {
  return db.linkedInProfile.upsert({
    where: { userId },
    update: {
      linkedInSubId: identity.sub,
      linkedInName: identity.name || `${identity.given_name || ""} ${identity.family_name || ""}`.trim(),
      linkedInEmail: identity.email || null,
      linkedInPictureUrl: identity.picture || null,
      connectedAt: new Date(),
    },
    create: {
      userId,
      linkedInSubId: identity.sub,
      linkedInName: identity.name || `${identity.given_name || ""} ${identity.family_name || ""}`.trim(),
      linkedInEmail: identity.email || null,
      linkedInPictureUrl: identity.picture || null,
      connectedAt: new Date(),
    },
  });
}

/**
 * Disconnect LinkedIn account safely.
 */
export async function disconnectLinkedInAccount(userId: string) {
  const existing = await db.linkedInProfile.findUnique({ where: { userId } });
  if (!existing) return null;

  return db.linkedInProfile.update({
    where: { userId },
    data: {
      linkedInSubId: null,
      linkedInName: null,
      linkedInEmail: null,
      linkedInPictureUrl: null,
      connectedAt: null,
    },
  });
}
