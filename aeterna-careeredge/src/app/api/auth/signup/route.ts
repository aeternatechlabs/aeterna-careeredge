// src/app/api/auth/signup/route.ts
// POST /api/auth/signup — creates a new user account

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie, createSession, isSecureCookie } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import type { SignupInput } from "@/types/auth";

// Indian mobile: 10 digits, starts with 6-9
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Supabase REST fallback (for Cloudflare Workers where Prisma TCP is unavailable) ──

type SignupRestResult =
  | { user: { id: string; name: string; email: string; onboardingCompleted: boolean } }
  | { error: "email_exists" | "mobile_exists" | "rest_failed" };

async function signupViaSupabaseRest(data: {
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  counsellorConsent: boolean;
}): Promise<SignupRestResult> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn("[signupViaSupabaseRest] Missing Supabase URL or Service Role Key");
    return { error: "rest_failed" };
  }

  const cleanUrl = supabaseUrl.replace(/\/+$/, "");
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  try {
    // 1. Duplicate check by email
    const emailCheckRes = await fetch(
      `${cleanUrl}/rest/v1/users?email=eq.${encodeURIComponent(data.email)}&select=id&limit=1`,
      { headers }
    );
    const emailRows = (await emailCheckRes.json().catch(() => [])) as Array<{ id: string }>;
    if (Array.isArray(emailRows) && emailRows.length > 0) {
      return { error: "email_exists" };
    }

    // 2. Duplicate check by mobile
    const mobileCheckRes = await fetch(
      `${cleanUrl}/rest/v1/users?mobile=eq.${encodeURIComponent(data.mobile)}&select=id&limit=1`,
      { headers }
    );
    const mobileRows = (await mobileCheckRes.json().catch(() => [])) as Array<{ id: string }>;
    if (Array.isArray(mobileRows) && mobileRows.length > 0) {
      return { error: "mobile_exists" };
    }

    // 3. Create user — generate a unique ID compatible with existing cuid-format IDs
    const now = new Date().toISOString();
    const newUserId =
      "usr_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

    const createRes = await fetch(`${cleanUrl}/rest/v1/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: newUserId,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        passwordHash: data.passwordHash,
        counsellorConsent: data.counsellorConsent,
        onboardingCompleted: false,
        createdAt: now,
        updatedAt: now,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text().catch(() => "");
      console.error("[signupViaSupabaseRest] Failed to create user:", errText);
      return { error: "rest_failed" };
    }

    const created = (await createRes.json().catch(() => [])) as Array<{
      id: string;
      name: string;
      email: string;
      onboardingCompleted: boolean;
    }>;

    if (!Array.isArray(created) || created.length === 0 || !created[0]?.id) {
      console.error("[signupViaSupabaseRest] Created user row not returned");
      return { error: "rest_failed" };
    }

    return {
      user: {
        id: created[0].id,
        name: created[0].name,
        email: created[0].email,
        onboardingCompleted: created[0].onboardingCompleted ?? false,
      },
    };
  } catch (err) {
    console.error("[signupViaSupabaseRest] Network or parse exception:", err);
    return { error: "rest_failed" };
  }
}

// ── Main route handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`signup:${ip}`, 5, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Partial<SignupInput>;

    const { name, email, mobile, password, counsellorConsent } = body;

    // ── Validation ─────────────────────────────────────────────────────────

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Full name must be at least 2 characters.", field: "name" },
        { status: 400 }
      );
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address.", field: "email" },
        { status: 400 }
      );
    }

    // Strip +91 prefix if present, then validate
    const normalizedMobile = mobile?.replace(/^\+91\s?/, "").replace(/\s/g, "") ?? "";
    if (!normalizedMobile || !MOBILE_REGEX.test(normalizedMobile)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number.", field: "mobile" },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters.", field: "password" },
        { status: 400 }
      );
    }

    // ── Hash password before any DB operation ─────────────────────────────

    const passwordHash = await bcrypt.hash(password, 12);

    // ── Attempt 1: Prisma (Node.js / local dev) ───────────────────────────

    let user: { id: string; name: string; email: string; onboardingCompleted: boolean } | null =
      null;

    try {
      const existingByEmail = await db.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });

      if (existingByEmail) {
        return NextResponse.json(
          { error: "An account with this email already exists.", field: "email" },
          { status: 409 }
        );
      }

      const existingByMobile = await db.user.findUnique({
        where: { mobile: normalizedMobile },
        select: { id: true },
      });

      if (existingByMobile) {
        return NextResponse.json(
          { error: "An account with this mobile number already exists.", field: "mobile" },
          { status: 409 }
        );
      }

      user = await db.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          mobile: normalizedMobile,
          passwordHash,
          counsellorConsent: counsellorConsent ?? false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          onboardingCompleted: true,
        },
      });
    } catch (prismaErr) {
      // ── Attempt 2: Supabase REST (Cloudflare Workers runtime) ────────────
      console.error("[Signup] Prisma failed, trying Supabase REST fallback:", prismaErr);

      const result = await signupViaSupabaseRest({
        name: name.trim(),
        email: email.toLowerCase(),
        mobile: normalizedMobile,
        passwordHash,
        counsellorConsent: counsellorConsent ?? false,
      });

      if ("error" in result) {
        if (result.error === "email_exists") {
          return NextResponse.json(
            { error: "An account with this email already exists.", field: "email" },
            { status: 409 }
          );
        }
        if (result.error === "mobile_exists") {
          return NextResponse.json(
            { error: "An account with this mobile number already exists.", field: "mobile" },
            { status: 409 }
          );
        }
        // rest_failed
        return NextResponse.json(
          { error: "Something went wrong. Please try again." },
          { status: 500 }
        );
      }

      user = result.user;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    // ── Set session cookie ─────────────────────────────────────────────────

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      onboardingCompleted: user.onboardingCompleted,
    };
    const sessionToken = await createSession(sessionPayload);
    await setSessionCookie(sessionPayload);

    const response = NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          onboardingCompleted: user.onboardingCompleted,
        },
      },
      { status: 201 }
    );

    response.cookies.set("ace_session", sessionToken, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("[Signup Error]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
