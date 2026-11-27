// src/app/api/interview-prep/[id]/mock-interview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  listMockInterviewSessions,
  startMockInterviewSession,
} from "@/lib/interview/mock-interviewer";

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
    const view = await listMockInterviewSessions(id, session.userId);
    if (!view) {
      return NextResponse.json({ error: "Interview kit not found" }, { status: 404 });
    }
    return NextResponse.json(view);
  } catch (err) {
    console.error("[MockInterview GET]", err);
    return NextResponse.json({ error: "Failed to load mock interviews" }, { status: 500 });
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
      interviewMode?: string;
      difficulty?: string;
      totalQuestions?: number;
      focusTopics?: string[];
      language?: string;
    };

    const result = await startMockInterviewSession({
      userId: session.userId,
      kitId: id,
      interviewMode: body.interviewMode,
      difficulty: body.difficulty,
      totalQuestions: body.totalQuestions,
      focusTopics: Array.isArray(body.focusTopics) ? body.focusTopics : undefined,
      language: body.language,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ session: result.session }, { status: 201 });
  } catch (err) {
    console.error("[MockInterview POST]", err);
    return NextResponse.json({ error: "Failed to start mock interview" }, { status: 500 });
  }
}
