// src/app/api/interview-prep/[id]/study-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  createOrRegenerateStudyPlan,
  getKitStudyPlanView,
} from "@/lib/interview/study-plan-service";

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
    const view = await getKitStudyPlanView(id, session.userId);
    if (!view) {
      return NextResponse.json({ error: "Interview kit not found" }, { status: 404 });
    }
    return NextResponse.json(view);
  } catch (err) {
    console.error("[StudyPlan GET]", err);
    return NextResponse.json({ error: "Failed to load study plan" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      weeklyHours?: number;
      title?: string;
    };

    const result = await createOrRegenerateStudyPlan({
      userId: session.userId,
      kitId: id,
      weeklyHours: typeof body.weeklyHours === "number" ? body.weeklyHours : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ studyPlan: result.studyPlan }, { status: 201 });
  } catch (err) {
    console.error("[StudyPlan POST]", err);
    return NextResponse.json({ error: "Failed to create study plan" }, { status: 500 });
  }
}
