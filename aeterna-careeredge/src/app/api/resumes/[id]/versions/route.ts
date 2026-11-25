// src/app/api/resumes/[id]/versions/route.ts
// Resume Version History & Snapshot Management API (Part 2.4 & Part 4)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { computeResumeContentHash } from "@/lib/resume/adapter";
import type { FullResumeData } from "@/lib/resume/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const resume = await prisma.resume.findFirst({
      where: { id, userId: session.userId },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found or access denied." }, { status: 404 });
    }

    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId: id, userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        versionName: true,
        changeNote: true,
        contentHash: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ versions });
  } catch (err: unknown) {
    console.error("[VersionsGetRoute] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to load version history." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const resume = await prisma.resume.findFirst({
      where: { id, userId: session.userId },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found or access denied." }, { status: 404 });
    }

    const body = await req.json();
    const { versionName = "Saved Version", changeNote, snapshotData } = body;

    const fullData = snapshotData as FullResumeData;
    const contentHash = fullData?.contentHash || (fullData ? computeResumeContentHash(fullData) : "snapshot");

    const newVersion = await prisma.resumeVersion.create({
      data: {
        resumeId: id,
        userId: session.userId,
        versionName,
        changeNote: changeNote || null,
        contentHash,
        snapshot: JSON.stringify(snapshotData || resume.structuredData),
      },
    });

    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch (err: unknown) {
    console.error("[VersionsPostRoute] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to save version snapshot." },
      { status: 500 }
    );
  }
}
