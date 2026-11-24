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
      console.error("[Lead Capture DB Error, attempting Supabase REST fallback]:", {
        message: err.message || String(dbError),
        code: err.code,
      });

      // Edge runtime / Cloudflare Workers fallback via Supabase PostgREST HTTP API
      try {
        const restLeadId = await saveLeadViaSupabaseRest({
          name: name.trim(),
          email: normalizedEmail,
          mobile: normalizedMobile,
          city: city.trim(),
          educationLevel: status.trim(),
          careerInterest: interest.trim(),
          counsellorConsent: Boolean(counsellorConsent),
        });
        if (restLeadId) {
          leadRecordId = restLeadId;
        }
      } catch (restError) {
        console.error("[Supabase REST Fallback Error]:", restError);
      }
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

/**
 * Fallback direct persistence using Supabase PostgREST HTTP API.
 * Ensures leads are securely saved even in serverless edge runtimes
 * where Prisma native TCP connections might be restricted.
 */
async function saveLeadViaSupabaseRest(data: {
  name: string;
  email: string;
  mobile: string;
  city: string;
  educationLevel: string;
  careerInterest: string;
  counsellorConsent: boolean;
}): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn("[saveLeadViaSupabaseRest] Missing Supabase URL or Service Key");
    return null;
  }

  const cleanUrl = supabaseUrl.replace(/\/+$/, "");
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  try {
    // 1. Resolve or create user record
    let userId: string | null = null;
    const userQueryRes = await fetch(
      `${cleanUrl}/rest/v1/users?or=(email.eq.${encodeURIComponent(data.email)},mobile.eq.${encodeURIComponent(data.mobile)})&select=id&limit=1`,
      { headers }
    );

    const existingUsers = (await userQueryRes.json().catch(() => [])) as Array<{ id: string }>;
    if (Array.isArray(existingUsers) && existingUsers.length > 0 && existingUsers[0]?.id) {
      userId = existingUsers[0].id;
    } else {
      const newUserId = "usr_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const createUserRes = await fetch(`${cleanUrl}/rest/v1/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id: newUserId,
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          counsellorConsent: data.counsellorConsent,
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      if (createUserRes.ok) {
        userId = newUserId;
      } else {
        const errText = await createUserRes.text().catch(() => "");
        console.error("[saveLeadViaSupabaseRest] Failed to create user:", errText);
      }
    }

    if (!userId) return null;

    // 2. Insert into crm_leads table
    const leadId = "lead_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const insertLeadRes = await fetch(`${cleanUrl}/rest/v1/crm_leads`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: leadId,
        userId,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        city: data.city,
        educationLevel: data.educationLevel,
        careerInterest: data.careerInterest,
        counsellorConsent: data.counsellorConsent,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });

    if (insertLeadRes.ok) {
      const created = (await insertLeadRes.json().catch(() => [])) as Array<{ id: string }>;
      return (Array.isArray(created) && created[0]?.id) || leadId;
    } else {
      const errText = await insertLeadRes.text().catch(() => "");
      console.error("[saveLeadViaSupabaseRest] Failed to insert lead:", errText);
    }
  } catch (err) {
    console.error("[saveLeadViaSupabaseRest] Network or syntax exception:", err);
  }

  return null;
}
