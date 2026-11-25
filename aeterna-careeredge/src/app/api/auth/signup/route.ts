// src/app/api/auth/signup/route.ts
// POST /api/auth/signup — creates a new user account directly via Supabase

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setSessionCookie, createSession, isSecureCookie } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { makeRestId } from "@/lib/supabase/rest";
import type { SignupInput } from "@/types/auth";

// Indian mobile: 10 digits, starts with 6-9
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const supabase = getSupabaseAdmin();

    // ── 1. Duplicate check by email ────────────────────────────────────────

    const { data: existingEmail, error: emailErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (emailErr) {
      throw new Error(`Email duplicate check failed: ${emailErr.message}`);
    }

    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists.", field: "email" },
        { status: 409 }
      );
    }

    // ── 2. Duplicate check by mobile ───────────────────────────────────────

    const { data: existingMobile, error: mobileErr } = await supabase
      .from("users")
      .select("id")
      .eq("mobile", normalizedMobile)
      .maybeSingle();

    if (mobileErr) {
      throw new Error(`Mobile duplicate check failed: ${mobileErr.message}`);
    }

    if (existingMobile) {
      return NextResponse.json(
        { error: "An account with this mobile number already exists.", field: "mobile" },
        { status: 409 }
      );
    }

    // ── 3. Create user in Supabase ─────────────────────────────────────────

    const now = new Date().toISOString();
    const newUserId = makeRestId("usr");

    const { data: createdUser, error: insertError } = await supabase
      .from("users")
      .insert({
        id: newUserId,
        name: name.trim(),
        email: normalizedEmail,
        mobile: normalizedMobile,
        passwordHash,
        counsellorConsent: counsellorConsent ?? false,
        onboardingCompleted: false,
        createdAt: now,
        updatedAt: now,
      })
      .select("id, name, email, onboardingCompleted")
      .single();

    if (insertError || !createdUser) {
      throw new Error(`Failed to create user record: ${insertError?.message || "No row returned"}`);
    }

    // ── 4. Set session ─────────────────────────────────────────────────────

    const sessionPayload = {
      userId: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      onboardingCompleted: Boolean(createdUser.onboardingCompleted),
    };

    const sessionToken = await createSession(sessionPayload);
    try {
      await setSessionCookie(sessionPayload);
    } catch {
      // response.cookies.set below directly attaches cookie to the HTTP response
    }

    const response = NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          onboardingCompleted: Boolean(createdUser.onboardingCompleted),
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
    console.error("[Signup Route Error]", {
      name: err instanceof Error ? err.name : "UnknownError",
      message: err instanceof Error ? err.message : String(err),
      route: "/api/auth/signup",
    });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
