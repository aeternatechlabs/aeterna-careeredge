// src/app/api/interview-prep/[id]/roadmap/progress/route.ts
// PATCH /api/interview-prep/[id]/roadmap/progress — update topic status, bookmark, or notes

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  updateTopicProgress,
  type TopicProgressStatus,
} from "@/lib/interview/roadmap-engine";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json().catch(() => null)) as {
      topicId?: string;
      status?: TopicProgressStatus;
      bookmarked?: boolean;
      notes?: string | null;
    } | null;

    if (!body || typeof body.topicId !== "string" || !body.topicId.trim()) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }

    const result = await updateTopicProgress({
      userId: session.userId,
      kitId: id,
      topicId: body.topicId.trim(),
      status: body.status,
      bookmarked: body.bookmarked,
      notes: body.notes,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ progress: result.progress });
  } catch (error) {
    console.error("Error updating roadmap topic progress:", error);
    return NextResponse.json(
      { error: "Failed to update topic progress" },
      { status: 500 }
    );
  }
}
