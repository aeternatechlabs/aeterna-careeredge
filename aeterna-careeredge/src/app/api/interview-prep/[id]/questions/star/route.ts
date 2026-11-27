// src/app/api/interview-prep/[id]/questions/star/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { saveStarPracticeResponse } from "@/lib/interview/question-bank";

export const dynamic = "force-dynamic";

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
    const body = (await req.json().catch(() => null)) as {
      questionText?: string;
      situation?: string;
      task?: string;
      action?: string;
      result?: string;
      evidenceIds?: string[];
    } | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const res = await saveStarPracticeResponse({
      userId: session.userId,
      kitId: id,
      questionText: body.questionText || "",
      situation: body.situation || "",
      task: body.task || "",
      action: body.action || "",
      result: body.result || "",
      evidenceIds: Array.isArray(body.evidenceIds)
        ? body.evidenceIds.filter((e): e is string => typeof e === "string")
        : [],
    });

    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status });
    }
    return NextResponse.json({ entry: res.entry }, { status: 201 });
  } catch (err) {
    console.error("[StarPractice POST]", err);
    return NextResponse.json({ error: "Failed to save STAR practice" }, { status: 500 });
  }
}
