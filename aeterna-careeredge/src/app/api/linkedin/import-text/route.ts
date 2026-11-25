// src/app/api/linkedin/import-text/route.ts
// LinkedIn Manual Profile Text Import API (Day 2 Part 4.2)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseLinkedInProfileText } from "@/lib/linkedin/parser";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rawText } = body;

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { error: "Please paste a complete profile text export." },
        { status: 400 }
      );
    }

    const parsed = parseLinkedInProfileText(rawText, "LINKEDIN_TEXT");

    // Persist staged import data for student review
    await prisma.linkedInProfile.upsert({
      where: { userId: session.userId },
      update: {
        importedRawJson: JSON.stringify(parsed),
      },
      create: {
        userId: session.userId,
        importedRawJson: JSON.stringify(parsed),
      },
    });

    return NextResponse.json({
      success: true,
      parsed,
      message: "LinkedIn profile text imported for review.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to parse profile text." },
      { status: 500 }
    );
  }
}
