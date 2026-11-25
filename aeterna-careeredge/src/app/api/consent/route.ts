// src/app/api/consent/route.ts
// Plain-language consent recording & retrieval (Day 2 Section C2.1)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { recordConsent, type ConsentType } from "@/lib/compliance/consent";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const consents = await db.consentRecord.findMany({
    where: { userId: session.userId },
    orderBy: { grantedAt: "desc" },
  });

  const aiConsent = consents.find((c) => c.consentType === "AI_PROCESSING" && !c.revokedAt);
  const termsConsent = consents.find((c) => c.consentType === "TERMS_AND_PRIVACY" && !c.revokedAt);

  return NextResponse.json({
    consents,
    hasAiConsent: Boolean(aiConsent?.isGranted),
    hasTermsConsent: Boolean(termsConsent?.isGranted),
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { consentType, isGranted = true, version = "1.0" } =
      (await req.json()) as {
        consentType?: ConsentType;
        isGranted?: boolean;
        version?: string;
      };

    if (!consentType) {
      return NextResponse.json({ error: "Missing consentType" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const record = await recordConsent({
      userId: session.userId,
      consentType,
      isGranted,
      ipAddress: ip,
      userAgent,
      version,
    });

    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error("[Consent Error]", err);
    return NextResponse.json({ error: "Failed to record consent" }, { status: 500 });
  }
}
