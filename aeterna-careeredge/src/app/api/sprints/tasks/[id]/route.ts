// src/app/api/sprints/tasks/[id]/route.ts
// Toggle sprint task completion

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { toggleSprintTask } from "@/lib/sprints/service";

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
    const result = await toggleSprintTask(session.userId, id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling task:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
