// src/app/api/auth/login/route.ts
// POST /api/auth/login — authenticate existing user

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import type { LoginInput } from "@/types/auth";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

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

    const user = await db.user.findFirst({
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

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      onboardingCompleted: user.onboardingCompleted,
    });

    return NextResponse.json({
      message: "Logged in successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (err) {
    console.error("[Login Error]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
