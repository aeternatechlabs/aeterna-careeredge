// src/app/api/evidence/route.ts
// API for Evidence Vault ("Proof Bank") items (Day 2 Addendum Section B1)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getEvidenceItems, createEvidenceItem, type EvidenceType } from "@/lib/evidence/service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await getEvidenceItems(session.userId);
    return NextResponse.json({ items });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to load evidence items." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, type, relatedSkill, date, issuer, url, storedDocId, notes } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required fields." },
        { status: 400 }
      );
    }

    const item = await createEvidenceItem(session.userId, {
      title,
      type: type as EvidenceType,
      relatedSkill,
      date,
      issuer,
      url,
      storedDocId,
      provenance: "STUDENT_INPUT",
      notes,
    });

    return NextResponse.json({ item, message: "Evidence artifact saved to Vault." }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to save evidence artifact." },
      { status: 500 }
    );
  }
}
