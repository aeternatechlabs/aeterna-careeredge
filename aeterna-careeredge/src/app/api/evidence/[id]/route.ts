// src/app/api/evidence/[id]/route.ts
// Delete individual evidence item with ownership verification

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deleteEvidenceItem } from "@/lib/evidence/service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteEvidenceItem(session.userId, id);

    return NextResponse.json({ success: true, message: "Evidence item removed." });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to delete evidence item." },
      { status: 500 }
    );
  }
}
