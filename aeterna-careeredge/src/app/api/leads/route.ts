// src/app/api/leads/route.ts
// Handles prospective student lead capture from the landing page.
// Persists lead in database and dispatches instant email notification to the company inbox via Resend.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLeadNotificationEmail } from "@/lib/email/client";
import { recordConsent } from "@/lib/compliance/consent";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
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
    } = body;

    // 1. Validation
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

    // 5. Dispatch Email Notification via Resend to the company inbox
    await sendLeadNotificationEmail({
      name: name.trim(),
      email: normalizedEmail,
      mobile: normalizedMobile,
      city: city.trim(),
      status: status.trim(),
      interest: interest.trim(),
      counsellorConsent: Boolean(counsellorConsent),
    });

    return NextResponse.json({
      success: true,
      leadId: leadRecord.id,
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
