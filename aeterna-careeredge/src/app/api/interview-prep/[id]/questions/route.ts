// src/app/api/interview-prep/[id]/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getKitQuestionBankView } from "@/lib/interview/question-bank";

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
    const view = await getKitQuestionBankView(id, session.userId);
    if (!view) {
      return NextResponse.json({ error: "Interview kit not found" }, { status: 404 });
    }
    return NextResponse.json(view);
  } catch (err) {
    console.error("[QuestionBank GET]", err);
    return NextResponse.json({ error: "Failed to load question bank" }, { status: 500 });
  }
}
