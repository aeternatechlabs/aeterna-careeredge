// src/app/api/auth/signup/route.ts
// POST /api/auth/signup — creates a new user account

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
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

    // ── Duplicate check ────────────────────────────────────────────────────

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

    // ── Create user ────────────────────────────────────────────────────────

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
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

    // ── Set session cookie ─────────────────────────────────────────────────

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      onboardingCompleted: user.onboardingCompleted,
    });

    return NextResponse.json(
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
  } catch (err) {
    console.error("[Signup Error]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
