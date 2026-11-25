// src/app/api/truth-check/route.ts
// Deterministic Truth Check API (Day 2 Addendum Section B2)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { runTruthCheck, confirmClaimAsTruth } from "@/lib/truth-check/service";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      documentType = "RESUME",
      documentId,
      claimedSkills = [],
      claimedDegrees = [],
      claimedInstitutions = [],
      claimedEmployers = [],
      claimedCertifications = [],
    } = body;

    const report = await runTruthCheck({
      userId: session.userId,
      documentType,
      documentId,
      claimedSkills,
      claimedDegrees,
      claimedInstitutions,
      claimedEmployers,
      claimedCertifications,
    });

    return NextResponse.json({ report });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to execute Truth Check." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { field, claim } = body;

    if (!field || !claim) {
      return NextResponse.json(
        { error: "Field and claim are required to confirm truth." },
        { status: 400 }
      );
    }

    const result = await confirmClaimAsTruth({
      userId: session.userId,
      field,
      claim,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to confirm claim." },
      { status: 500 }
    );
  }
}
