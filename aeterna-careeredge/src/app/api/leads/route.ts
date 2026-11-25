// src/app/api/leads/route.ts
// Handles prospective student lead capture from the landing page.
// Persists lead in database and dispatches instant email notification to the company inbox via Resend.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLeadNotificationEmail } from "@/lib/email/client";
import { recordConsent } from "@/lib/compliance/consent";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import {
  getSupabaseRestConfig,
  makeRestId,
  supabaseRestFetch,
} from "@/lib/supabase/rest";

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

    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

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

      // Only invoke REST fallback if the lead was not already persisted above
      if (!leadRecordId) {
        try {
          const restLeadId = await saveLeadViaSupabaseRest({
            name: name.trim(),
            email: normalizedEmail,
            mobile: normalizedMobile,
            city: city.trim(),
            educationLevel: status.trim(),
            careerInterest: interest.trim(),
            counsellorConsent: Boolean(counsellorConsent),
            ipAddress,
            userAgent,
          });
          if (restLeadId) {
            leadRecordId = restLeadId;
          }
        } catch (restError) {
          console.error("[Supabase REST Fallback Error]:", restError);
        }
      }
    }

    if (!leadRecordId) {
      return NextResponse.json(
        { error: "Failed to save your details. Please try again." },
        { status: 500 }
      );
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

async function findLeadUserViaRest(
  config: NonNullable<ReturnType<typeof getSupabaseRestConfig>>,
  email: string,
  mobile: string
): Promise<string | null> {
  // Query email first, then mobile separately to avoid PostgREST or= syntax issues
  const byEmail = await supabaseRestFetch<Array<{ id: string }>>(
    config,
    `/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`
  );
  if (byEmail.ok && Array.isArray(byEmail.data) && byEmail.data[0]?.id) {
    return byEmail.data[0].id;
  }

  const byMobile = await supabaseRestFetch<Array<{ id: string }>>(
    config,
    `/rest/v1/users?mobile=eq.${encodeURIComponent(mobile)}&select=id&limit=1`
  );
  if (byMobile.ok && Array.isArray(byMobile.data) && byMobile.data[0]?.id) {
    return byMobile.data[0].id;
  }

  return null;
}

/**
 * Fallback direct persistence using Supabase PostgREST HTTP API.
 * Ensures leads and consent audit records are securely saved in edge runtimes
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
  ipAddress: string;
  userAgent: string;
}): Promise<string | null> {
  const config = getSupabaseRestConfig();
  if (!config) {
    console.warn("[saveLeadViaSupabaseRest] Missing Supabase URL or Service Role Key");
    return null;
  }

  try {
    // 1. Resolve or create user record
    let userId = await findLeadUserViaRest(config, data.email, data.mobile);

    if (!userId) {
      const now = new Date().toISOString();
      const newUserId = makeRestId("usr");
      const createUserRes = await supabaseRestFetch<Array<{ id: string }>>(
        config,
        "/rest/v1/users",
        {
          method: "POST",
          body: JSON.stringify({
            id: newUserId,
            name: data.name,
            email: data.email,
            mobile: data.mobile,
            passwordHash: null,
            counsellorConsent: data.counsellorConsent,
            onboardingCompleted: false,
            createdAt: now,
            updatedAt: now,
          }),
        }
      );

      if (createUserRes.ok) {
        userId = (Array.isArray(createUserRes.data) && createUserRes.data[0]?.id) || newUserId;
      } else if (createUserRes.status === 409) {
        // Concurrent request raced to insert the same email/mobile; re-query
        userId = await findLeadUserViaRest(config, data.email, data.mobile);
      } else {
        console.error("[saveLeadViaSupabaseRest] Failed to create user:", createUserRes.errorText);
      }
    }

    if (!userId) return null;

    // 2. Insert into crm_leads table
    const now = new Date().toISOString();
    const leadId = makeRestId("lead");
    const insertLeadRes = await supabaseRestFetch<Array<{ id: string }>>(
      config,
      "/rest/v1/crm_leads",
      {
        method: "POST",
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
          createdAt: now,
          updatedAt: now,
        }),
      }
    );

    if (!insertLeadRes.ok) {
      console.error("[saveLeadViaSupabaseRest] Failed to insert lead:", insertLeadRes.errorText);
      return null;
    }

    const persistedLeadId =
      (Array.isArray(insertLeadRes.data) && insertLeadRes.data[0]?.id) || leadId;

    // 3. Record compliance consent audit trail when granted (parity with Prisma path)
    if (data.counsellorConsent) {
      const consentRes = await supabaseRestFetch<Array<{ id: string }>>(
        config,
        "/rest/v1/consent_records",
        {
          method: "POST",
          body: JSON.stringify({
            id: makeRestId("cns"),
            userId,
            consentType: "COUNSELLOR_CONTACT",
            isGranted: true,
            grantedAt: now,
            revokedAt: null,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            version: "1.0",
          }),
        }
      );

      if (!consentRes.ok) {
        console.error("[saveLeadViaSupabaseRest] Failed to record consent:", consentRes.errorText);
      }
    }

    return persistedLeadId;
  } catch (err) {
    console.error("[saveLeadViaSupabaseRest] Network or syntax exception:", err);
  }

  return null;
}
