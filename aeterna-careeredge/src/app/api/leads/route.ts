// src/app/api/leads/route.ts
// Handles prospective student lead capture from the landing page directly via Supabase.
// Persists lead in database and dispatches instant email notification to the company inbox via Brevo/Resend.

import { NextRequest, NextResponse } from "next/server";
import { sendLeadNotificationEmail } from "@/lib/email/client";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { makeRestId } from "@/lib/supabase/rest";

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

    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    // 4. Resolve or create associated user record for relational integrity
    let userId: string | null = null;

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${normalizedEmail},mobile.eq.${normalizedMobile}`)
      .limit(1)
      .maybeSingle();

    if (existingUser?.id) {
      userId = existingUser.id;
    } else {
      const newUserId = makeRestId("usr");
      const { data: newUser, error: createErr } = await supabase
        .from("users")
        .insert({
          id: newUserId,
          name: name.trim(),
          email: normalizedEmail,
          mobile: normalizedMobile,
          passwordHash: null,
          counsellorConsent: Boolean(counsellorConsent),
          onboardingCompleted: false,
          createdAt: now,
          updatedAt: now,
        })
        .select("id")
        .single();

      if (createErr && createErr.code === "23505") {
        // Race condition duplicate, re-fetch
        const { data: refetched } = await supabase
          .from("users")
          .select("id")
          .or(`email.eq.${normalizedEmail},mobile.eq.${normalizedMobile}`)
          .limit(1)
          .maybeSingle();
        userId = refetched?.id || newUserId;
      } else {
        userId = newUser?.id || newUserId;
      }
    }

    if (!userId) {
      throw new Error("Failed to resolve or create student user record.");
    }

    // 5. Persist Lead in crm_leads table
    const leadId = makeRestId("lead");
    const { data: leadRecord, error: leadErr } = await supabase
      .from("crm_leads")
      .insert({
        id: leadId,
        userId,
        name: name.trim(),
        email: normalizedEmail,
        mobile: normalizedMobile,
        city: city.trim(),
        educationLevel: status.trim(),
        careerInterest: interest.trim(),
        counsellorConsent: Boolean(counsellorConsent),
        syncStatus: "PENDING",
        createdAt: now,
        updatedAt: now,
      })
      .select("id")
      .single();

    if (leadErr && !leadRecord) {
      throw new Error(`Failed to persist CRM lead: ${leadErr.message}`);
    }

    const savedLeadId = leadRecord?.id || leadId;

    // 6. Record compliance consent audit trail when granted
    if (counsellorConsent) {
      try {
        await supabase.from("consent_records").insert({
          id: makeRestId("cns"),
          userId,
          consentType: "COUNSELLOR_CONTACT",
          isGranted: true,
          grantedAt: now,
          revokedAt: null,
          ipAddress,
          userAgent,
          version: "1.0",
        });
      } catch (cnsErr: unknown) {
        console.warn("[Consent Audit Non-Fatal Warning]:", cnsErr);
      }
    }

    // 7. Dispatch Email Notification via Brevo/Resend to the company inbox
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
      leadId: savedLeadId,
      message: "Thank you! Our career guidance team has received your information.",
    });
  } catch (error) {
    console.error("[Lead Capture Route Error]:", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      route: "/api/leads",
    });
    return NextResponse.json(
      { error: "Failed to submit your details. Please try again." },
      { status: 500 }
    );
  }
}
