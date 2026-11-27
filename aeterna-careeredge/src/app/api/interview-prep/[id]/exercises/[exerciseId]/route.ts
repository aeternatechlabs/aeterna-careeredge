// src/app/api/interview-prep/[id]/exercises/[exerciseId]/route.ts
// POST /api/interview-prep/[id]/exercises/[exerciseId] — update practical exercise submission

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  submitPracticeExercise,
  type ExerciseSubmissionStatus,
} from "@/lib/interview/roadmap-engine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; exerciseId: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, exerciseId } = await params;
    const body = (await req.json().catch(() => null)) as {
      status?: ExerciseSubmissionStatus;
      notes?: string | null;
      artifactUrl?: string | null;
      evidenceItemId?: string | null;
    } | null;

    if (!body || typeof body.status !== "string") {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const result = await submitPracticeExercise({
      userId: session.userId,
      kitId: id,
      exerciseId,
      status: body.status,
      notes: body.notes,
      artifactUrl: body.artifactUrl,
      evidenceItemId: body.evidenceItemId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ submission: result.submission });
  } catch (error) {
    console.error("Error submitting practice exercise:", error);
    return NextResponse.json(
      { error: "Failed to save exercise submission" },
      { status: 500 }
    );
  }
}
