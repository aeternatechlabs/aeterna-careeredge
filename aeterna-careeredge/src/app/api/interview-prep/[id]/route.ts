// src/app/api/interview-prep/[id]/route.ts
// Retrieve single interview prep kit (ownership-scoped & backward-compatible)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { serializeInterviewKit } from "@/lib/interview/service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || typeof id !== "string" || id.length > 100) {
      return NextResponse.json({ error: "Invalid kit ID" }, { status: 400 });
    }

    const kit = await db.interviewPrepKit.findFirst({
      where: { id, userId: session.userId },
    });

    if (!kit) {
      return NextResponse.json({ error: "Interview kit not found" }, { status: 404 });
    }

    return NextResponse.json(serializeInterviewKit(kit));
  } catch (error) {
    console.error("Error retrieving interview kit:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview kit" },
      { status: 500 }
    );
  }
}
