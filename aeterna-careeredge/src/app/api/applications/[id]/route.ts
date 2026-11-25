// src/app/api/applications/[id]/route.ts
// Update or delete a job application

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  updateApplicationStatus,
  deleteApplication,
  type ApplicationStatus,
} from "@/lib/applications/service";

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
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const updated = await updateApplicationStatus(
      session.userId,
      id,
      body.status as ApplicationStatus,
      body.notes,
      body.followUpDate ? new Date(body.followUpDate) : undefined
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteApplication(session.userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
