// src/app/api/auth/login/route.ts
// POST /api/auth/login — authenticate existing user

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie, createSession, isSecureCookie } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { getSupabaseRestConfig, supabaseRestFetch } from "@/lib/supabase/rest";
import type { LoginInput } from "@/types/auth";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

interface LoginUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  onboardingCompleted: boolean;
}

async function findLoginUserViaSupabaseRest(
  isMobile: boolean,
  lookupValue: string
): Promise<LoginUserRecord | null> {
  const config = getSupabaseRestConfig();
  if (!config) {
    throw new Error("Supabase REST fallback unavailable: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const filterField = isMobile ? "mobile" : "email";
  const select = "id,name,email,passwordHash,onboardingCompleted";
  const res = await supabaseRestFetch<LoginUserRecord[]>(
    config,
    `/rest/v1/users?${filterField}=eq.${encodeURIComponent(lookupValue)}&select=${select}&limit=1`
  );

  if (!res.ok) {
    throw new Error(`Supabase REST login lookup failed (${res.status}): ${res.errorText}`);
  }

  const row = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
  if (!row) return null;

  return {
    ...row,
    passwordHash: row.passwordHash ?? null,
    onboardingCompleted: Boolean(row.onboardingCompleted),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`login:${ip}`, 10, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Partial<LoginInput>;
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/mobile and password are required." },
        { status: 400 }
      );
    }

    // ── Find the user by email or mobile ──────────────────────────────────

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const normalizedMobile = identifier.replace(/^\+91\s?/, "").replace(/\s/g, "");
    const isMobile = MOBILE_REGEX.test(normalizedMobile);

    let user: LoginUserRecord | null = null;

    try {
      user = await db.user.findFirst({
        where: isMobile
          ? { mobile: normalizedMobile }
          : { email: normalizedIdentifier },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
          onboardingCompleted: true,
        },
      });
    } catch (prismaErr) {
      console.warn("[Login] Prisma unavailable, using Supabase REST fallback:", prismaErr);
      user = await findLoginUserViaSupabaseRest(
        isMobile,
        isMobile ? normalizedMobile : normalizedIdentifier
      );
    }

    // ── Constant-time response to prevent user enumeration ────────────────

    if (!user || !user.passwordHash) {
      // Even if user doesn't exist, run bcrypt to prevent timing attacks
      await bcrypt.compare(password, "$2a$12$invalidhashplaceholderxxxxxxxxxxx");
      return NextResponse.json(
        { error: "Incorrect email/mobile or password." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Incorrect email/mobile or password." },
        { status: 401 }
      );
    }

    // ── Set session ────────────────────────────────────────────────────────

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      onboardingCompleted: user.onboardingCompleted,
    };
    const sessionToken = await createSession(sessionPayload);
    try {
      await setSessionCookie(sessionPayload);
    } catch {
      // response.cookies.set below sets the cookie directly on the HTTP response
    }

    const response = NextResponse.json({
      message: "Logged in successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
      },
    });

    response.cookies.set("ace_session", sessionToken, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("[Login Error]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
