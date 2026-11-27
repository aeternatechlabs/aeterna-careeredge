// src/app/api/interview-prep/[id]/study-plan/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { updateStudyPlanTask } from "@/lib/interview/study-plan-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, taskId } = await params;
    const body = (await req.json().catch(() => null)) as {
      status?: "PENDING" | "COMPLETED" | "DEFERRED" | "SKIPPED";
      scheduledDate?: string | null;
      syncToSprint?: boolean;
    } | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = await updateStudyPlanTask({
      userId: session.userId,
      kitId: id,
      taskId,
      status: body.status,
      scheduledDate: body.scheduledDate,
      syncToSprint: body.syncToSprint,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[StudyPlanTask PATCH]", err);
    return NextResponse.json({ error: "Failed to update study plan task" }, { status: 500 });
  }
}
