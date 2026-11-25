// src/app/api/interview-prep/[id]/route.ts
// Retrieve single interview prep kit

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import type { InterviewPrepTheme } from "@/lib/interview/service";

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
    const kit = await db.interviewPrepKit.findFirst({
      where: { id, userId: session.userId },
    });

    if (!kit) {
      return NextResponse.json({ error: "Interview kit not found" }, { status: 404 });
    }

    let themes: InterviewPrepTheme[] = [];
    try {
      themes = JSON.parse(kit.themesJson);
    } catch {}

    return NextResponse.json({
      id: kit.id,
      jobId: kit.jobId,
      jobTitle: kit.jobTitle,
      companyName: kit.companyName,
      themes,
      createdAt: kit.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error retrieving interview kit:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview kit" },
      { status: 500 }
    );
  }
}
