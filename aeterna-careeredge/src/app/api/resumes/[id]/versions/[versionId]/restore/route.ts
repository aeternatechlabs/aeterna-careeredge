// src/app/api/resumes/[id]/versions/[versionId]/restore/route.ts
// Restore Resume Version Endpoint (Part 2.4 & 4)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, versionId } = await params;
    const version = await db.resumeVersion.findFirst({
      where: {
        id: versionId,
        resumeId: id,
        userId: session.userId,
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Version snapshot not found." }, { status: 404 });
    }

    // Save a backup of current state before restoring
    const currentResume = await db.resume.findFirst({
      where: { id, userId: session.userId },
    });

    if (currentResume) {
      await db.resumeVersion.create({
        data: {
          resumeId: id,
          userId: session.userId,
          versionName: `Auto-backup before restore (${new Date().toLocaleTimeString()})`,
          changeNote: "Automatic state preservation before version rollback",
          contentHash: currentResume.contentHash || "backup",
          snapshot: currentResume.structuredData || "{}",
        },
      });
    }

    // Restore version snapshot into Resume
    let parsedSnapshot: Record<string, unknown> = {};
    try {
      parsedSnapshot = JSON.parse(version.snapshot);
    } catch {
      parsedSnapshot = {};
    }

    const updated = await db.resume.update({
      where: { id },
      data: {
        structuredData: version.snapshot,
        contentHash: version.contentHash,
        targetRole: parsedSnapshot.targetRole ? String(parsedSnapshot.targetRole) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      restoredVersionId: version.id,
      resume: updated,
    });
  } catch (err: unknown) {
    console.error("[RestoreVersionRoute] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to restore version." },
      { status: 500 }
    );
  }
}
