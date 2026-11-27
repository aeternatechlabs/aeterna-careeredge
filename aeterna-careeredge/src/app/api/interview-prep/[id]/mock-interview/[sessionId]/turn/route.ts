// src/app/api/interview-prep/[id]/mock-interview/[sessionId]/turn/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { submitMockInterviewTurn } from "@/lib/interview/mock-interviewer";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, sessionId } = await params;
    const body = (await req.json().catch(() => null)) as { answer?: string } | null;
    if (!body || typeof body.answer !== "string") {
      return NextResponse.json({ error: "answer is required" }, { status: 400 });
    }

    const result = await submitMockInterviewTurn({
      userId: session.userId,
      kitId: id,
      sessionId,
      answer: body.answer,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[MockInterviewTurn POST]", err);
    return NextResponse.json({ error: "Failed to evaluate interview turn" }, { status: 500 });
  }
}
