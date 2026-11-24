// src/app/api/leads/route.ts
// Handles prospective student lead capture from the landing page.
// Persists lead in database and dispatches instant email notification to the company inbox via Resend.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLeadNotificationEmail } from "@/lib/email/client";
import { recordConsent } from "@/lib/compliance/consent";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    // 1. Sliding-window IP Rate Limiting (5 requests / minute)
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`leads:${ip}`, 5, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many submissions from this connection. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      name,
      mobile,
      email,
      city,
      status,
      interest,
      counsellorConsent,
      marketingConsent,
      hp_company, // Honeypot trap
    } = body;

    // 2. Honeypot check: Bots fill hidden fields; silently drop
    if (hp_company) {
      return NextResponse.json({
        success: true,
        message: "Thank you! Your information has been received.",
      });
    }

    // 3. Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Full name must be at least 2 characters.", field: "name" },
        { status: 400 }
      );
    }

    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address.", field: "email" },
        { status: 400 }
      );
    }

    const normalizedMobile = (mobile || "")
      .replace(/^\+91\s?/, "")
      .replace(/\D/g, "");
    if (!normalizedMobile || !MOBILE_REGEX.test(normalizedMobile)) {
      return NextResponse.json(
        {
          error: "Please enter a valid 10-digit Indian mobile number.",
          field: "mobile",
        },
        { status: 400 }
      );
    }

    if (!city || typeof city !== "string") {
      return NextResponse.json(
        { error: "Please select your city.", field: "city" },
        { status: 400 }
      );
    }

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { error: "Please select your academic or professional status.", field: "status" },
        { status: 400 }
      );
    }

    if (!interest || typeof interest !== "string") {
      return NextResponse.json(
        { error: "Please select your primary interest.", field: "interest" },
        { status: 400 }
      );
    }

    // 2. Resolve or create associated user record for relational integrity
    let leadRecordId: string | undefined;

    try {
      let user = await db.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            { mobile: normalizedMobile },
          ],
        },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            mobile: normalizedMobile,
            passwordHash: null, // Lead created without password; can claim account via reset/signup
            counsellorConsent: Boolean(counsellorConsent),
            onboardingCompleted: false,
          },
        });
      }

      // 3. Persist Lead in CrmLead table
      const leadRecord = await db.crmLead.create({
        data: {
          userId: user.id,
          name: name.trim(),
          email: normalizedEmail,
          mobile: normalizedMobile,
          city: city.trim(),
          educationLevel: status.trim(),
          careerInterest: interest.trim(),
          counsellorConsent: Boolean(counsellorConsent),
          syncStatus: "PENDING",
        },
      });
      leadRecordId = leadRecord.id;

      // 4. Record compliance consent
      const ipAddress =
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";
      const userAgent = req.headers.get("user-agent") || "unknown";

      if (counsellorConsent) {
        await recordConsent({
          userId: user.id,
          consentType: "COUNSELLOR_CONTACT",
          isGranted: true,
          version: "1.0",
          ipAddress,
          userAgent,
        });
      }
    } catch (dbError: unknown) {
      const err = dbError as { message?: string; code?: string; meta?: unknown; stack?: string };
      console.error("[Lead Capture DB Error]:", {
        message: err.message || String(dbError),
        code: err.code,
        meta: err.meta,
        stack: err.stack,
      });
      // Do not abort: continue to send email notification so lead is never lost
    }

    // 5. Dispatch Email Notification via Brevo/Resend to the company inbox
    try {
      await sendLeadNotificationEmail({
        name: name.trim(),
        email: normalizedEmail,
        mobile: normalizedMobile,
        city: city.trim(),
        status: status.trim(),
        interest: interest.trim(),
        counsellorConsent: Boolean(counsellorConsent),
      });
    } catch (emailError) {
      console.error("[Lead Capture Email Error]:", emailError);
    }

    return NextResponse.json({
      success: true,
      leadId: leadRecordId,
      message: "Thank you! Our career guidance team has received your information.",
    });
  } catch (error) {
    console.error("[Lead Capture Error]:", error);
    return NextResponse.json(
      { error: "Failed to submit your details. Please try again." },
      { status: 500 }
    );
  }
}
