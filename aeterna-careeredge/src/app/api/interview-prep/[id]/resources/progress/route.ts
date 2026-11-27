// src/app/api/interview-prep/[id]/resources/progress/route.ts
// PATCH /api/interview-prep/[id]/resources/progress — update studied, saved, reportedBroken, or notes

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { updateStudentResourceProgress } from "@/lib/interview/resources/service";

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
      resourceId?: string;
      studied?: boolean;
      saved?: boolean;
      reportedBroken?: boolean;
      notes?: string | null;
    } | null;

    if (!body || typeof body.resourceId !== "string" || !body.resourceId.trim()) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    if (
      (body.studied !== undefined && typeof body.studied !== "boolean") ||
      (body.saved !== undefined && typeof body.saved !== "boolean") ||
      (body.reportedBroken !== undefined && typeof body.reportedBroken !== "boolean") ||
      (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string")
    ) {
      return NextResponse.json({ error: "Invalid progress field types" }, { status: 400 });
    }

    const result = await updateStudentResourceProgress({
      userId: session.userId,
      kitId: id,
      resourceId: body.resourceId.trim(),
      studied: body.studied,
      saved: body.saved,
      reportedBroken: body.reportedBroken,
      notes: body.notes,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ progress: result.progress });
  } catch (error) {
    console.error("Error updating student resource progress:", error);
    return NextResponse.json(
      { error: "Failed to update resource progress" },
      { status: 500 }
    );
  }
}
